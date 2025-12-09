#!/usr/bin/env node

/**
 * SEO 验证脚本
 * 检查 sitemap、robots.txt 和其他 SEO 文件是否正确配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const files = [
  'public/sitemap.xml',
  'public/robots.txt',
  'public/BingSiteAuth.xml',
  'dist/sitemap.xml',
  'dist/robots.txt',
  'dist/BingSiteAuth.xml',
];

console.log('\n📋 SEO 文件验证报告\n');
console.log('='.repeat(50));

let allPass = true;

// 检查文件存在性
console.log('\n✓ 文件存在性检查:\n');
files.forEach(file => {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  const size = exists ? ` (${fs.statSync(filePath).size} bytes)` : '';
  console.log(`  ${status} ${file}${size}`);
  if (!exists) allPass = false;
});

// 检查 sitemap.xml 格式
console.log('\n✓ Sitemap 格式检查:\n');
const sitemapPath = path.join(projectRoot, 'public/sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const content = fs.readFileSync(sitemapPath, 'utf-8');
  const checks = [
    { name: 'XML 声明', regex: /^<\?xml/ },
    { name: 'urlset 标签', regex: /<urlset/ },
    { name: 'URL 条目', regex: /<url>/ },
    { name: 'loc 标签', regex: /<loc>/ },
    { name: 'changefreq 标签', regex: /<changefreq>/ },
    { name: 'priority 标签', regex: /<priority>/ },
  ];

  checks.forEach(check => {
    const pass = check.regex.test(content);
    const status = pass ? '✅' : '❌';
    console.log(`  ${status} ${check.name}`);
    if (!pass) allPass = false;
  });

  // 计算 URL 数量
  const urlCount = (content.match(/<url>/g) || []).length;
  console.log(`\n  📊 URL 数量: ${urlCount}`);
}

// 检查 robots.txt
console.log('\n✓ Robots.txt 检查:\n');
const robotsPath = path.join(projectRoot, 'public/robots.txt');
if (fs.existsSync(robotsPath)) {
  const content = fs.readFileSync(robotsPath, 'utf-8');
  const hasSitemap = /Sitemap:/i.test(content);
  const status = hasSitemap ? '✅' : '❌';
  console.log(`  ${status} 包含 Sitemap 声明`);
  if (!hasSitemap) allPass = false;
}

// 检查 HTML 中的 sitemap 声明
console.log('\n✓ HTML Sitemap 声明检查:\n');
const htmlPath = path.join(projectRoot, 'index.html');
if (fs.existsSync(htmlPath)) {
  const content = fs.readFileSync(htmlPath, 'utf-8');
  const hasSitemapLink = /rel="sitemap"/i.test(content);
  const status = hasSitemapLink ? '✅' : '❌';
  console.log(`  ${status} 在 HTML 中声明 sitemap 链接`);
  if (!hasSitemapLink) allPass = false;
}

// 总结
console.log('\n' + '='.repeat(50));
if (allPass) {
  console.log('\n✅ 所有检查通过！Sitemap 已正确配置。\n');
  console.log('📝 可访问的 URL:');
  console.log('  - https://promptsgo.cc/sitemap.xml');
  console.log('  - https://promptsgo.cc/robots.txt');
  console.log('  - https://promptsgo.cc/BingSiteAuth.xml\n');
} else {
  console.log('\n❌ 某些检查未通过，请检查上述错误。\n');
  process.exit(1);
}

