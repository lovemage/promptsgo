#!/usr/bin/env node

/**
 * Sitemap Generator Script
 * 在构建时生成动态 sitemap.xml
 * 使用方法: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

// 确保 public 目录存在
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 基础 URL（可以从环境变量读取）
const baseUrl = process.env.SITE_URL || 'https://promptsgo.cc';

// 生成基础 sitemap
const generateBasicSitemap = () => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // 主页
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}</loc>\n`;
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';
  
  // 全局提示页面
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/?view=global</loc>\n`;
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>0.9</priority>\n';
  xml += '  </url>\n';
  
  xml += '</urlset>';
  return xml;
};

try {
  const sitemapContent = generateBasicSitemap();
  fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8');
  console.log(`✅ Sitemap generated successfully at ${sitemapPath}`);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}

