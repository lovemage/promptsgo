import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const applyChanges = process.argv.includes('--apply');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const isCloudinaryUrl = value =>
  typeof value === 'string' && value.includes('res.cloudinary.com');

const queryTable = async (table, columns) => {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + 999);

    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
    from += 1000;
  }
};

const tables = {
  global_prompts: await queryTable(
    'global_prompts',
    'id,image,component_images,video,author_avatar'
  ),
  users: await queryTable('users', 'id,avatar_url'),
  comments: await queryTable('comments', 'id,user_avatar,media'),
  app_banners: await queryTable('app_banners', 'id,image_url'),
};

const urls = new Set();
for (const rows of Object.values(tables)) {
  for (const row of rows) {
    for (const value of Object.values(row)) {
      const values = Array.isArray(value) ? value : [value];
      values.filter(isCloudinaryUrl).forEach(url => urls.add(url));
    }
  }
}

const brokenUrls = new Set();
let cursor = 0;
const urlList = [...urls];
const checkWorker = async () => {
  while (cursor < urlList.length) {
    const url = urlList[cursor++];
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if ([401, 404, 410].includes(response.status)) brokenUrls.add(url);
      await response.body?.cancel();
    } catch {
      // Network errors are not treated as proof that a URL is permanently broken.
    }
  }
};
await Promise.all(Array.from({ length: 12 }, checkWorker));

const affected = {
  global_prompts: tables.global_prompts.filter(row =>
    [row.image, row.video, row.author_avatar, ...(row.component_images || [])]
      .some(value => brokenUrls.has(value))
  ),
  users: tables.users.filter(row => brokenUrls.has(row.avatar_url)),
  comments: tables.comments.filter(row =>
    [row.user_avatar, row.media].some(value => brokenUrls.has(value))
  ),
  app_banners: tables.app_banners.filter(row => brokenUrls.has(row.image_url)),
};

const summary = Object.fromEntries(
  Object.entries(affected).map(([table, rows]) => [table, rows.length])
);
console.log(JSON.stringify({
  mode: applyChanges ? 'apply' : 'dry-run',
  cloudinaryUrls: urls.size,
  brokenUrls: brokenUrls.size,
  affectedRows: summary,
}, null, 2));

if (!applyChanges || brokenUrls.size === 0) process.exit(0);

const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const backupPath = `/tmp/promptsgo-cloudinary-url-backup-${timestamp}.json`;
await writeFile(backupPath, JSON.stringify({
  createdAt: new Date().toISOString(),
  affected,
}, null, 2));

for (const row of affected.global_prompts) {
  const { error } = await supabase
    .from('global_prompts')
    .update({
      image: brokenUrls.has(row.image) ? null : row.image,
      video: brokenUrls.has(row.video) ? null : row.video,
      author_avatar: brokenUrls.has(row.author_avatar) ? null : row.author_avatar,
      component_images: (row.component_images || []).filter(url => !brokenUrls.has(url)),
    })
    .eq('id', row.id);
  if (error) throw error;
}

for (const row of affected.users) {
  const { error } = await supabase
    .from('users')
    .update({ avatar_url: null })
    .eq('id', row.id);
  if (error) throw error;
}

for (const row of affected.comments) {
  const { error } = await supabase
    .from('comments')
    .update({
      user_avatar: brokenUrls.has(row.user_avatar) ? null : row.user_avatar,
      media: brokenUrls.has(row.media) ? null : row.media,
    })
    .eq('id', row.id);
  if (error) throw error;
}

for (const row of affected.app_banners) {
  const { error } = await supabase
    .from('app_banners')
    .delete()
    .eq('id', row.id);
  if (error) throw error;
}

console.log(`Backup: ${backupPath}`);
console.log('Broken Cloudinary references removed.');
