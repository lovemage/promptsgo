# Sitemap 配置指南

## 问题诊断

之前无法获取 sitemap 的原因：
1. ❌ 没有静态 `sitemap.xml` 文件
2. ❌ 前端生成的 sitemap 无法被搜索引擎爬取
3. ❌ `index.html` 中没有声明 sitemap 链接
4. ❌ 没有 `robots.txt` 文件

## 解决方案

### 1. 静态 Sitemap 文件
- **位置**: `public/sitemap.xml`
- **用途**: 搜索引擎爬虫直接访问
- **更新**: 在构建时自动生成

### 2. Robots.txt 文件
- **位置**: `public/robots.txt`
- **用途**: 告诉搜索引擎 sitemap 位置
- **内容**: 包含 `Sitemap: https://promptsgo.com/sitemap.xml`

### 3. HTML 声明
- **位置**: `index.html` 的 `<head>` 标签
- **内容**: `<link rel="sitemap" type="application/xml" href="/sitemap.xml">`

### 4. 构建脚本
- **位置**: `scripts/generate-sitemap.js`
- **触发**: 在 `npm run build` 时自动执行
- **功能**: 生成基础 sitemap（可扩展为包含动态内容）

## 使用方法

### 开发环境
```bash
npm run dev
```
访问 `http://localhost:3000/sitemap.xml` 查看 sitemap

### 生产构建
```bash
npm run build
```
自动生成 `dist/sitemap.xml`

### 手动生成 Sitemap
```bash
node scripts/generate-sitemap.js
```

## 验证 Sitemap

### 1. 本地验证
```bash
# 检查文件是否存在
ls -la public/sitemap.xml
ls -la public/robots.txt

# 查看内容
cat public/sitemap.xml
```

### 2. 在线验证
- Google Search Console: https://search.google.com/search-console
- Bing Webmaster Tools: https://www.bing.com/webmasters
- XML Sitemap Validator: https://www.xml-sitemaps.com/validate-xml-sitemap.html

### 3. 浏览器访问
- `https://promptsgo.com/sitemap.xml`
- `https://promptsgo.com/robots.txt`

## 扩展功能

### 动态 Sitemap 生成（包含所有 Prompts）

如需在构建时包含所有 global prompts，需要：

1. 创建后端 API 端点来获取所有 prompts
2. 修改 `scripts/generate-sitemap.js` 调用该 API
3. 示例：

```javascript
// 在 generate-sitemap.js 中
const response = await fetch('https://your-api.com/api/prompts');
const prompts = await response.json();

prompts.forEach(prompt => {
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/?promptId=${prompt.id}</loc>\n`;
  xml += `    <lastmod>${prompt.updatedAt}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n`;
});
```

## SEO 最佳实践

1. ✅ 保持 sitemap 大小 < 50MB
2. ✅ 最多 50,000 个 URL
3. ✅ 定期更新（每周或每月）
4. ✅ 在 robots.txt 中声明 sitemap
5. ✅ 在 HTML 中链接 sitemap
6. ✅ 提交到 Google Search Console 和 Bing Webmaster Tools

## 文件清单

- ✅ `public/sitemap.xml` - 静态 sitemap
- ✅ `public/robots.txt` - 搜索引擎爬虫指南
- ✅ `scripts/generate-sitemap.js` - 构建脚本
- ✅ `index.html` - 添加 sitemap 链接
- ✅ `package.json` - 更新 build 脚本
- ✅ `services/globalService.ts` - 改进的动态生成函数

