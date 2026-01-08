#!/usr/bin/env node

/**
 * Sitemap Generator Script
 * Generates sitemap.xml with Supabase data and language variants.
 * Usage: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

// Load environment variables
dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env.local') });

// Setup Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const baseUrl = process.env.SITE_URL || 'https://promptsgo.cc';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found in .env or .env.local');
  console.warn('   Generating basic sitemap only.');
}

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const languages = ['en', 'zh-TW', 'ja', 'ko'];

const generateSitemap = async () => {
  console.log('🚀 Starting sitemap generation...');

  let prompts = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('global_prompts')
        .select('id, updated_at, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching prompts from Supabase:', error.message);
      } else {
        prompts = data || [];
        console.log(`📊 Found ${prompts.length} global prompts.`);
      }
    } catch (err) {
      console.error('❌ Unexpected error fetching prompts:', err);
    }
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Helper function to add URL
  const addUrl = (loc, lastmod, changefreq, priority) => {
    xml += '  <url>\n';
    xml += `    <loc>${loc}</loc>\n`;
    if (lastmod) {
      try {
        const date = new Date(lastmod);
        // Use YYYY-MM-DD format which is safest for Google
        const dateStr = date.toISOString().split('T')[0];
        xml += `    <lastmod>${dateStr}</lastmod>\n`;
      } catch (e) {
        // Ignore invalid dates
      }
    }
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  };

  // 1. Static Pages (Home & Global View) with Language Variants
  languages.forEach(lang => {
    const isDefault = lang === 'en';
    // For Home, we use ?lang=xx or nothing.
    // If it's just one param, it doesn't need &amp;, but ?lang=... is fine legally.
    // However, if we do have multiple params, we need &amp;.

    const langParam = isDefault ? '' : `?lang=${lang}`;
    const langParamAppend = isDefault ? '' : `&amp;lang=${lang}`; // For URLs that already have params

    // Home Page
    const homeUrl = isDefault ? baseUrl : `${baseUrl}/${langParam}`;
    addUrl(homeUrl, new Date().toISOString().split('T')[0], 'daily', 1.0);

    // Global View Page
    // This one has ?view=global AND potentially &lang=...
    // So `?view=global` is fine, but if we append lang, it must be `&amp;lang=`
    const globalUrl = `${baseUrl}/?view=global${langParamAppend}`;
    addUrl(globalUrl, new Date().toISOString().split('T')[0], 'daily', 0.9);
  });

  // 2. Dynamic Prompts with Language Variants
  // Limit to 40,000 URLs to be safe (50k limit per file)
  // With 4 languages, that means max 10,000 prompts.
  const promptLimit = 10000;
  const processedPrompts = prompts.slice(0, promptLimit);

  processedPrompts.forEach(prompt => {
    const lastmod = prompt.updated_at || prompt.created_at;

    languages.forEach(lang => {
      const isDefault = lang === 'en';
      // URL components must be joined before escaping, or at least the params part
      // But simpler is to build string then escape. However, standard URL encoding isn't XML escaping.
      // XML needs & -> &amp;

      const langParamAppend = isDefault ? '' : `&amp;lang=${lang}`;
      // Note: baseUrl might have query params already? No, usually siteroot.
      // But line 110 uses ?promptId=...

      const url = `${baseUrl}/?promptId=${prompt.id}${langParamAppend}`;
      addUrl(url, lastmod, 'weekly', 0.8);
    });
  });

  xml += '</urlset>';

  // Ensure public dir exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(sitemapPath, xml, 'utf-8');
  console.log(`✅ Sitemap successfully generated at ${sitemapPath}`);
  console.log(`   Total URLs: ${(2 * languages.length) + (processedPrompts.length * languages.length)}`);
};

generateSitemap().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
