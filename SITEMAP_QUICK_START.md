# Sitemap 快速开始指南

## 🎯 问题已解决！

你的 sitemap 问题已经完全修复。以下是快速参考：

## 📁 新增文件

```
public/sitemap.xml          ← 静态 sitemap（搜索引擎爬取）
public/robots.txt           ← 搜索引擎爬虫指南
scripts/generate-sitemap.js ← 自动生成脚本
SITEMAP_SETUP.md           ← 详细配置文档
SITEMAP_FIX_SUMMARY.md     ← 修复总结
```

## 🔧 修改的文件

```
index.html                  ← 添加 sitemap 链接
package.json               ← 更新 build 脚本
services/globalService.ts  ← 改进动态生成函数
```

## ✅ 验证 Sitemap

### 方式 1：本地测试
```bash
npm run dev
# 访问 http://localhost:3000/sitemap.xml
# 访问 http://localhost:3000/robots.txt
```

### 方式 2：构建后验证
```bash
npm run build
# 检查 dist/sitemap.xml 和 dist/robots.txt
```

### 方式 3：在线验证
- Google: https://search.google.com/search-console
- Bing: https://www.bing.com/webmasters
- Validator: https://www.xml-sitemaps.com/validate-xml-sitemap.html

## 🚀 部署步骤

1. **本地测试**
   ```bash
   npm run build
   npm run preview
   ```

2. **验证文件**
   - 确保 `dist/sitemap.xml` 存在
   - 确保 `dist/robots.txt` 存在

3. **部署到生产**
   ```bash
   git add .
   git commit -m "Fix: Add sitemap and robots.txt for SEO"
   git push
   ```

4. **提交到搜索引擎**
   - Google Search Console: 提交 sitemap
   - Bing Webmaster Tools: 提交 sitemap

## 📊 Sitemap 内容

当前 sitemap 包含：
- ✅ 主页 (https://promptsgo.com)
- ✅ 全局提示页面 (https://promptsgo.com/?view=global)

## 🔄 自动更新

每次运行 `npm run build` 时，sitemap 会自动重新生成。

## 📝 扩展功能

要在 sitemap 中包含所有 global prompts，修改 `scripts/generate-sitemap.js`：

```javascript
// 添加 API 调用获取所有 prompts
const response = await fetch('https://your-api.com/api/prompts');
const prompts = await response.json();

// 添加到 sitemap
prompts.forEach(prompt => {
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/?promptId=${prompt.id}</loc>\n`;
  xml += `    <lastmod>${prompt.updatedAt}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n`;
});
```

## ❓ 常见问题

**Q: 为什么我的 sitemap 只有 2 个 URL？**
A: 当前是基础 sitemap。要包含所有 prompts，需要修改脚本调用 API。

**Q: 多久更新一次 sitemap？**
A: 每次构建时更新。可设置 cron 任务定期构建。

**Q: 搜索引擎多久会爬取 sitemap？**
A: 通常 24-48 小时内。可在 Search Console 中手动提交加速。

## 📚 相关文档

- [SITEMAP_SETUP.md](./SITEMAP_SETUP.md) - 详细配置指南
- [SITEMAP_FIX_SUMMARY.md](./SITEMAP_FIX_SUMMARY.md) - 修复总结
- [Google Sitemap 文档](https://developers.google.com/search/docs/beginner/sitemaps)

## 🎉 完成！

你的 sitemap 现在已经可以被搜索引擎正确爬取了！

