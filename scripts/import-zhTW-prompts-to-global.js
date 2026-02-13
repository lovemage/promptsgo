#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');

// Load environment variables from common files
dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env.local') });

const readmePath = path.join(projectRoot, 'temp_prompts_repo', 'README_zh-TW.md');
const batchSize = Number(process.env.IMPORT_BATCH_SIZE || 100);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseKey = serviceRoleKey || anonKey;
const hasDbCreds = Boolean(supabaseUrl && supabaseKey);
const supabase = hasDbCreds ? createClient(supabaseUrl, supabaseKey) : null;

function stripCodeFence(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```[\w-]*\n([\s\S]*?)\n```$/);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

function extractSection(block, headingRegex) {
  const match = headingRegex.exec(block);
  if (!match) return '';

  const sectionStart = match.index + match[0].length;
  const rest = block.slice(sectionStart);
  const nextHeadingMatch = rest.match(/^####\s+/m);
  const sectionEnd = nextHeadingMatch ? sectionStart + nextHeadingMatch.index : block.length;

  return block.slice(sectionStart, sectionEnd).trim();
}

function parseMarkdownPrompts(content) {
  const headingRegex = /^### No\.\s+\d+:\s+(.+)$/gm;
  const headings = Array.from(content.matchAll(headingRegex));

  const prompts = [];

  for (let i = 0; i < headings.length; i += 1) {
    const h = headings[i];
    const title = (h[1] || '').trim();
    const start = h.index;
    const end = i + 1 < headings.length ? headings[i + 1].index : content.length;
    const block = content.slice(start, end);

    const descriptionRaw = extractSection(block, /^####\s+📖\s+描述\s*$/m);
    const promptRaw = extractSection(block, /^####\s+📝\s+提示詞\s*$/m);

    const description = descriptionRaw.replace(/^[-\s]+|[-\s]+$/g, '').trim();
    const positive = stripCodeFence(promptRaw);

    const image1Match = block.match(/#####\s*Image\s*1[\s\S]*?<img\s+src="([^"]+)"/i);
    const image1 = image1Match ? image1Match[1].trim() : null;

    const authorMatch = block.match(/-\s*\*\*作者:\*\*\s*(?:\[([^\]]+)\]\(([^)]+)\)|(.+))/);
    const sourceMatch = block.match(/-\s*\*\*來源:\*\*\s*(?:\[([^\]]+)\]\(([^)]+)\)|(.+))/);

    const authorName = (authorMatch?.[1] || authorMatch?.[3] || '').trim() || 'Unknown';
    const authorLink = (authorMatch?.[2] || '').trim() || null;
    const sourceUrl = (sourceMatch?.[2] || '').trim() || null;

    if (!title || !positive) {
      continue;
    }

    prompts.push({
      title,
      description: description || null,
      positive,
      image: image1,
      authorName,
      authorLink,
      sourceUrl,
    });
  }

  return prompts;
}

async function fetchExistingKeys() {
  if (!supabase) {
    throw new Error('Supabase client not initialized.');
  }
  const pageSize = 1000;
  let from = 0;
  const keys = new Set();

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('global_prompts')
      .select('title,source_url')
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch existing prompts: ${error.message}`);
    }

    if (!data || data.length === 0) break;

    for (const row of data) {
      const key = `${(row.title || '').trim()}||${(row.source_url || '').trim()}`;
      keys.add(key);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return keys;
}

function toDbRow(prompt) {
  const noteParts = [];
  if (prompt.authorLink) noteParts.push(`author_link: ${prompt.authorLink}`);

  return {
    id: crypto.randomUUID(),
    title: prompt.title,
    description: prompt.description,
    positive: prompt.positive,
    negative: null,
    note: noteParts.length > 0 ? noteParts.join('\n') : null,
    author_id: null,
    author_name: prompt.authorName,
    author_avatar: null,
    tags: [],
    model_tags: ['nano-banana-pro'],
    image: prompt.image,
    component_images: [],
    video: null,
    source_url: prompt.sourceUrl,
    rating: 0,
    rating_count: 0,
    views: 0,
  };
}

async function insertInBatches(rows) {
  if (!supabase) {
    throw new Error('Supabase client not initialized.');
  }
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('global_prompts').insert(batch);
    if (error) {
      if (error.message && error.message.includes('row-level security policy')) {
        throw new Error(
          'RLS blocked insert on global_prompts. Use SUPABASE_SERVICE_ROLE_KEY in .env for server-side import.'
        );
      }
      throw new Error(`Batch insert failed at index ${i}: ${error.message}`);
    }
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${rows.length}`);
  }

  return inserted;
}

async function main() {
  if (!fs.existsSync(readmePath)) {
    console.error(`README not found: ${readmePath}`);
    process.exit(1);
  }

  const md = fs.readFileSync(readmePath, 'utf8');
  const parsed = parseMarkdownPrompts(md);

  console.log(`Parsed prompts from README_zh-TW.md: ${parsed.length}`);
  if (parsed.length > 0) {
    const sample = parsed[0];
    console.log('Sample extracted fields:');
    console.log(JSON.stringify({
      title: sample.title,
      description: sample.description,
      prompt: `${sample.positive.slice(0, 120)}...`,
      image1: sample.image,
      author: sample.authorName,
      source: sample.sourceUrl,
    }, null, 2));
  }

  if (isDryRun) {
    console.log('Dry run mode: no database writes.');
    return;
  }

  if (!hasDbCreds) {
    console.error('Missing Supabase credentials. Need VITE_SUPABASE_URL + (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY).');
    process.exit(1);
  }

  const existingKeys = await fetchExistingKeys();
  const toInsert = [];
  let skipped = 0;

  for (const prompt of parsed) {
    const dedupeKey = `${prompt.title.trim()}||${(prompt.sourceUrl || '').trim()}`;
    if (existingKeys.has(dedupeKey)) {
      skipped += 1;
      continue;
    }
    toInsert.push(toDbRow(prompt));
  }

  if (toInsert.length === 0) {
    console.log(`No new prompts to insert. Skipped duplicates: ${skipped}`);
    return;
  }

  console.log(`Ready to insert: ${toInsert.length}. Skipped duplicates: ${skipped}`);
  const inserted = await insertInBatches(toInsert);

  console.log('Import complete.');
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
