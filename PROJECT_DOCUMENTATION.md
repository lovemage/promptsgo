# PromptsGo 專案文檔

> **版本**: 1.0  
> **最後更新**: 2025-12-22  
> **生產網址**: https://promptsgo-mu.vercel.app

---

## 📋 目錄

1. [專案概述](#專案概述)
2. [核心功能](#核心功能)
3. [技術架構](#技術架構)
4. [社群互動方式](#社群互動方式)
5. [會員升級模式](#會員升級模式)
6. [新手教學](#新手教學)
7. [本地圖書館功能](#本地圖書館功能)
8. [資料庫結構](#資料庫結構)
9. [開發指南](#開發指南)

---

## 專案概述

**PromptsGo** 是一個現代化的提示詞（Prompt）管理與分享平台，專為 AI 創作者設計。用戶可以：

- 📝 **管理個人提示詞**：在本地圖書館中建立、編輯、分類提示詞
- 🌍 **分享至全球社群**：將優質提示詞發布到 Global Prompts 社群
- ⭐ **成就系統**：透過分享提示詞獲得徽章、解鎖主題和頭像
- 💬 **互動評論**：對社群提示詞進行評分和評論

### 支援語言

- English (en)
- 繁體中文 (zh-TW)
- 日本語 (ja)
- 한국어 (ko)

### 支援主題

| 主題 | 解鎖條件 |
|------|----------|
| Light | 預設解鎖 |
| Journal | 預設解鎖 |
| Binder | 分享 2 篇 |
| Glass | 分享 3 篇 |
| Dark | 分享 5 篇 |
| Royal | 分享 8 篇 |
| Greenble | 分享 8 篇 |

---

## 核心功能

### 1. 提示詞卡片系統

每張提示詞卡片包含：

```typescript
interface Prompt {
  id: string;           // 唯一識別碼
  title: string;        // 標題
  description?: string; // 描述（選填）
  positive: string;     // 正向提示詞
  negative?: string;    // 反向提示詞（選填）
  note?: string;        // 私人筆記（選填）
  categoryIds: string[]; // 關聯分類
  modelTags?: string[]; // AI 模型標籤（如 SDXL, Midjourney）
  createdAt: number;    // 建立時間
  updatedAt: number;    // 更新時間
}
```

### 2. 全球提示詞 (Global Prompts)

發布到社群的提示詞額外包含：

```typescript
interface GlobalPrompt extends Prompt {
  authorId: string;          // 作者 ID
  authorName: string;        // 作者名稱
  authorAvatar?: string;     // 作者頭像
  tags: string[];            // 內容標籤
  image?: string;            // 成果圖片 URL
  componentImages?: string[]; // 組件圖片（最多 4 張）
  video?: string;            // 影片 URL
  sourceUrl?: string;        // 原始來源連結
  rating: number;            // 平均評分（1-5）
  ratingCount: number;       // 評分數量
  comments: Comment[];       // 評論列表
  views: number;             // 觀看次數
  collectCount?: number;     // 收藏次數
}
```

### 3. 分類管理系統

用戶可自訂分類，每個分類包含：

```typescript
interface Category {
  id: string;
  name: string;     // 分類名稱
  color: string;    // Tailwind 顏色類別（如 'bg-blue-500'）
  icon: string;     // Lucide 圖示名稱
}
```

預設分類：
- 🎨 Art & Design（藝術與設計）
- 💻 Coding（程式設計）
- ✍️ Writing（寫作）
- 📷 Photography（攝影）

---

## 技術架構

### 前端技術棧

| 技術 | 用途 |
|------|------|
| **React 18** | UI 框架 |
| **TypeScript** | 型別安全 |
| **Tailwind CSS** | 樣式框架 |
| **Vite** | 建構工具 |
| **Lucide React** | 圖示庫 |

### 後端服務

| 服務 | 用途 |
|------|------|
| **Supabase** | 資料庫、身份驗證、即時訂閱 |
| **Google OAuth** | 社群登入 |
| **Cloudinary** | 圖片/影片上傳與存儲 |
| **Gemini API** | AI 優化提示詞 |

### 目錄結構

```
promptsgo/
├── App.tsx              # 主應用程式元件
├── types.ts             # TypeScript 類型定義
├── constants.ts         # 常量（翻譯、預設資料）
├── index.html           # HTML 入口
├── index.tsx            # React 入口
├── index.css            # 全域樣式
│
├── components/          # UI 元件
│   ├── AvatarPickerModal.tsx    # 頭像選擇器
│   ├── CategoryManager.tsx      # 分類管理
│   ├── CreatorBadge.tsx         # 創作者徽章
│   ├── Footer.tsx               # 頁尾
│   ├── GlobalPromptCard.tsx     # 全球提示詞卡片
│   ├── GlobalView.tsx           # 全球提示詞視圖
│   ├── HeroCarousel.tsx         # 首頁輪播
│   ├── LegalView.tsx            # 法律條款視圖
│   ├── NicknameModal.tsx        # 暱稱選擇器
│   ├── OnboardingTour.tsx       # 新手教學導覽
│   ├── PromptModal.tsx          # 提示詞編輯彈窗
│   ├── ShareModal.tsx           # 分享至全球彈窗
│   ├── UnlockModal.tsx          # 解鎖提示彈窗
│   ├── UpgradeGuideView.tsx     # 升級指南視圖
│   └── WebViewWarning.tsx       # WebView 警告
│
├── services/            # 服務層
│   ├── authService.ts         # 身份驗證服務
│   ├── cloudinaryService.ts   # 圖片上傳服務
│   ├── geminiService.ts       # AI 服務
│   ├── globalService.ts       # 全球提示詞 CRUD
│   ├── nicknameService.ts     # 暱稱服務
│   ├── storageService.ts      # 本地/雲端存儲服務
│   └── supabaseClient.ts      # Supabase 客戶端
│
├── utils/               # 工具函式
│   ├── avatarUtils.ts         # 頭像相關工具
│   ├── badgeUtils.ts          # 徽章計算工具
│   └── webviewDetector.ts     # WebView 偵測
│
├── public/              # 靜態資源
│   ├── avators_promptgp/      # 預設頭像
│   ├── gold.png               # 金幣徽章
│   ├── star.png               # 星星徽章
│   └── silver.png             # 銀幣徽章
│
└── scripts/             # 建置腳本
    └── generate-sitemap.js    # Sitemap 生成器
```

---

## 社群互動方式

### 1. 分享提示詞到全球

用戶可以將本地提示詞分享到 Global Prompts 社群：

**流程**：
1. 在本地圖書館中點擊提示詞卡片的「分享」圖示
2. 填寫額外資訊：
   - 內容標籤（Tags）
   - AI 模型標籤（Model Tags）
   - 成果圖片/影片（選填）
   - 原始來源連結（選填）
   - 是否匿名發布
3. 點擊「發布至全球」

**AI 輔助功能**：
- 使用 Gemini API 可自動優化提示詞內容
- 一鍵生成標題、描述和標籤建議

### 2. 收藏與收集 (GP Collection)

- 用戶可點擊「書籤」圖示收藏喜歡的全球提示詞
- 收藏的提示詞會顯示在「GP Collection」中
- 收藏數據同步到雲端，跨設備可用

### 3. 評論與評分

**評論功能**：
```typescript
interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;      // 評論內容
  rating: number;       // 評分（1-5 星）
  media?: string;       // 附加圖片/影片
  createdAt: number;
}
```

**互動規則**：
- 必須登入才能評論和評分
- 每則評論可附帶一張圖片
- 評分會即時更新提示詞的平均分數

### 4. 觀看與瀏覽

- 每次開啟提示詞詳情頁會增加觀看次數
- 支援按標籤、模型、關鍵字篩選提示詞
- 首頁輪播展示精選內容

---

## 會員升級模式

PromptsGo 採用**基於貢獻的升級系統**，用戶透過分享提示詞來提升等級。

### 徽章系統

| 徽章 | 獲取方式 | 說明 |
|------|----------|------|
| 🥈 銀幣 (Silver) | 分享 5 篇提示詞 | 基礎徽章 |
| ⭐ 星星 (Star) | 5 個銀幣 = 1 個星星 | 相當於 25 篇提示詞 |
| 🏅 金幣 (Gold) | 5 個星星 = 1 個金幣 | 相當於 125 篇提示詞 |

### 等級階梯

| 等級 | 分享數量 | 稱號（繁體中文） | 稱號（English） |
|------|----------|------------------|-----------------|
| 1 | 5 篇 | 新手創作者 | Novice Creator |
| 2 | 10 篇 | 見習學徒 | Apprentice |
| 3 | 15 篇 | 探索者 | Explorer |
| 4 | 20 篇 | 工匠 | Artisan |
| 5 | 25 篇 | 星級創作者 | Star Creator |
| 6 | 50 篇 | 明日之星 | Rising Star |
| 7 | 75 篇 | 提示詞工程師 | Prompt Engineer |
| 8 | 100 篇 | 專家 | Specialist |
| 9 | 125 篇 | 達人 | Expert |
| 10 | 250 篇 | 金牌大師 | Gold Master |
| 11 | 375 篇 | 宗師 | Grandmaster |
| 12 | 500 篇 | 賢者 | Sage |
| 13 | 625 篇 | 傳奇 | Legend |
| 14 | 750 篇 | 半神 | Demi-God |
| 15 | 875+ 篇 | 提示詞之神 | God of Prompts |

### 等級獎勵

#### 1. 主題解鎖

| 主題 | 需求等級/分享數 |
|------|-----------------|
| Binder | 2 篇 |
| Glass | 3 篇 |
| Dark | 5 篇 |
| Royal | 8 篇 |
| Greenble | 8 篇 |

#### 2. 頭像解鎖

**ava 系列頭像**：
- Level 1：ava1-6（6 款）
- Level 2：ava1-12（12 款）
- Level 3+：ava1-18（18 款全解鎖）

**avb 系列頭像**：
- Level 4：avb1-6（6 款）
- Level 5+：avb1-16（16 款全解鎖）

#### 3. 自訂頭像上傳

- **解鎖條件**：Level 5+（星級創作者）
- 可上傳自訂圖片作為頭像
- 需要配置 Cloudinary 服務

#### 4. 暱稱系統

**暱稱代幣（Nickname Tokens）**：
- 完成新手教學獲得初始 3 個代幣
- 每升一級獲得 1 個代幣
- 使用代幣可重新抽取暱稱組合

**暱稱組成**：
- 暱稱圖示（Emoji）
- 暱稱名稱

---

## 新手教學

PromptsGo 提供互動式新手教學導覽（Onboarding Tour），在用戶首次登入時自動啟動。

### 教學步驟

| 步驟 | 目標元素 | 標題 | 內容 |
|------|----------|------|------|
| 1 | 本地圖書館按鈕 | 本地圖書館 | 這是您的個人提示詞收藏庫，隨時隨地都可存取，甚至離線也能使用！ |
| 2 | 新增提示詞按鈕 | 建立新提示詞 | 點擊這裡新增提示詞。內建 AI 助手可協助您優化內容。 |
| 3 | 分類設定按鈕 | 分類管理 | 在這裡管理您的分類。自訂顏色與圖示，依照您的喜好整理提示詞。 |
| 4 | 分享按鈕 | 分享至全球 | 將您最棒的提示詞分享給社群！點擊卡片上的分享圖示即可發布。 |
| 5 | 分享按鈕 | 分享升級！ | 分享 5 篇提示詞即可解鎖創作者徽章！持續分享可獲得銀幣、星星和金幣徽章。 |

### 教學技術實現

```typescript
interface TourStep {
  targetId: string;       // 目標 DOM 元素 ID
  title: string;          // 步驟標題
  content: string;        // 步驟說明
  position?: 'top' | 'bottom' | 'left' | 'right'; // 提示框位置
  showBadgePreview?: boolean; // 是否顯示徽章預覽
}
```

**特色功能**：
- 使用 SVG 遮罩突出顯示目標元素
- 自動滾動至目標位置
- 響應式設計，自動調整提示框位置
- 完成教學後自動標記（localStorage）

### 教學完成後

1. 初始化暱稱代幣（3 個）
2. 提示選擇暱稱（如果尚未設定）
3. 關閉側邊欄
4. 記錄完成狀態，不再重複顯示

---

## 本地圖書館功能

本地圖書館是用戶管理個人提示詞的核心區域。

### 主要功能

#### 1. 提示詞 CRUD

| 操作 | 說明 |
|------|------|
| **建立** | 點擊「新增提示詞」按鈕，填寫標題、正向/反向提示詞、筆記、分類等 |
| **讀取** | 以卡片形式瀏覽所有提示詞，支援搜尋和分類篩選 |
| **更新** | 點擊卡片上的「編輯」圖示修改內容 |
| **刪除** | 點擊「刪除」圖示，確認後移除 |

#### 2. 批量操作

- **全選/取消全選**：一鍵選取所有提示詞
- **批量刪除**：選取多張卡片後一次刪除
- **勾選框**：每張卡片左上角有勾選框

#### 3. 分類篩選

- 側邊欄顯示所有分類及各分類的提示詞數量
- 點擊分類可篩選顯示
- 「未分類」分類顯示沒有任何分類的提示詞

#### 4. 搜尋功能

- 搜尋範圍：標題、描述、正向提示詞
- 即時過濾，無需按 Enter

#### 5. 快速複製

- 每張卡片可一鍵複製「正向提示詞」或「反向提示詞」
- 複製成功顯示綠色勾勾圖示

#### 6. 筆記功能

- 滑鼠懸停在筆記圖示上可預覽筆記內容
- 筆記內容為私人，不會隨分享發布

### 資料存儲

**本地存儲（LocalStorage）**：
```typescript
// 存儲 Key 格式
const STORAGE_KEY = 'promptsgo_data_v1';
const getStorageKey = (userId?: string) => 
  userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;

// 存儲內容
interface StoredData {
  prompts: Prompt[];
  categories: Category[];
  theme: ThemeId;
  language: LanguageCode;
  collectedGlobalIds: string[];
}
```

**雲端同步**：
- 登入用戶的資料會自動同步到 Supabase
- 使用防抖機制（2 秒延遲）避免頻繁寫入
- 資料存儲在 `users` 表的 `data` JSON 欄位

### AI 優化功能

使用 Gemini API 對提示詞進行優化：

```typescript
// geminiService.ts
export const generateShareMetaWithAI = async (prompt: Prompt): Promise<GeneratedMeta>
```

- 自動生成更好的標題
- 優化正向/反向提示詞
- 建議相關標籤

---

## 資料庫結構

### Supabase 表格

#### 1. users（用戶表）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid (PK) | 用戶 ID（來自 Auth） |
| email | text | 電子郵件 |
| full_name | text | 顯示名稱 |
| avatar_url | text | 頭像 URL |
| nickname | text | 自訂暱稱 |
| nickname_icon | text | 暱稱圖示（Emoji） |
| nickname_tokens | integer | 暱稱代幣數量 |
| nickname_level | integer | 暱稱等級 |
| data | jsonb | 用戶資料（prompts, categories 等） |
| created_at | timestamptz | 建立時間 |
| updated_at | timestamptz | 更新時間 |

#### 2. global_prompts（全球提示詞表）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid (PK) | 提示詞 ID |
| title | text | 標題 |
| description | text | 描述 |
| positive | text | 正向提示詞 |
| negative | text | 反向提示詞 |
| note | text | 筆記 |
| author_id | uuid (FK) | 作者 ID |
| author_name | text | 作者名稱 |
| author_avatar | text | 作者頭像 |
| tags | text[] | 內容標籤 |
| model_tags | text[] | 模型標籤 |
| image | text | 成果圖片 URL |
| component_images | text[] | 組件圖片（最多 4） |
| video | text | 影片 URL |
| source_url | text | 原始來源 |
| rating | numeric | 平均評分 |
| rating_count | integer | 評分數量 |
| views | integer | 觀看次數 |
| created_at | timestamptz | 建立時間 |
| updated_at | timestamptz | 更新時間 |

#### 3. comments（評論表）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid (PK) | 評論 ID |
| prompt_id | uuid (FK) | 關聯提示詞 ID |
| user_id | uuid (FK) | 評論者 ID |
| user_name | text | 評論者名稱 |
| user_avatar | text | 評論者頭像 |
| content | text | 評論內容 |
| rating | integer | 評分（1-5） |
| media | text | 附加媒體 URL |
| created_at | timestamptz | 建立時間 |

#### 4. app_banners（首頁輪播表）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid (PK) | Banner ID |
| image_url | text | 圖片 URL |
| created_at | timestamptz | 建立時間 |

---

## 開發指南

### 環境設置

1. **安裝依賴**：
   ```bash
   npm install
   ```

2. **設定環境變數**（`.env.local`）：
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_GEMINI_API_KEY=your-gemini-api-key
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_API_KEY=your-api-key
   VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
   ```

3. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```

### Google OAuth 設定

#### Google Cloud Console

1. 前往 **APIs & Services > Credentials**
2. 建立/編輯 OAuth 2.0 Client ID

**Authorized JavaScript Origins**：
- `http://localhost:3000`
- `https://promptsgo-mu.vercel.app`
- `https://your-project.supabase.co`

**Authorized Redirect URIs**：
- `https://your-project.supabase.co/auth/v1/callback`

#### Supabase Dashboard

1. **Authentication > Providers > Google**：
   - 啟用 Google
   - 輸入 Client ID 和 Client Secret

2. **Authentication > URL Configuration**：
   - Site URL: `https://promptsgo-mu.vercel.app`
   - Redirect URLs: 加入 `http://localhost:3000`

### 建置與部署

**建置生產版本**：
```bash
npm run build
```

**部署**：
- 推薦使用 Vercel
- 設定環境變數後自動部署

### 程式碼風格

- 使用 TypeScript 嚴格模式
- React 函數元件 + Hooks
- Tailwind CSS 原子類別
- 服務層抽象業務邏輯

---

## 附錄

### 常見問題

**Q: 為什麼無法使用 Google 登入？**  
A: 請確認不是在 App 內建瀏覽器中開啟網站，建議使用 Safari 或 Chrome。

**Q: 資料會同步到雲端嗎？**  
A: 登入用戶的資料會自動同步，未登入用戶資料僅存在本地。

**Q: 如何更換頭像？**  
A: 點擊側邊欄個人資訊區的「更換頭像」，選擇已解鎖的頭像。

**Q: 如何解鎖更多主題？**  
A: 分享更多提示詞到 Global Prompts 即可解鎖。

---

## 🎯 作品集摘要

### PromptsGo — AI 提示詞管理與社群平台

> 一站式 AI 提示詞管理工具，結合社群分享與遊戲化成就系統

---

**專案類型**：Web Application（SPA）

**線上預覽**：[https://promptsgo-mu.vercel.app](https://promptsgo-mu.vercel.app)

---

### ✨ 專案亮點

| 功能 | 說明 |
|------|------|
| 🌍 **多語系支援** | 英文、繁中、日文、韓文 四語自動切換 |
| 🎨 **7 種主題風格** | 從極簡到玻璃擬態，滿足不同視覺偏好 |
| ☁️ **雲端同步** | 登入後自動跨設備同步資料 |
| 🤖 **AI 智能優化** | 整合 Gemini API，一鍵優化提示詞內容 |
| 🏆 **成就系統** | 徽章、等級、解鎖機制，提升用戶黏著度 |
| 👥 **社群互動** | 分享、收藏、評分、評論，完整社群功能 |
| 📱 **響應式設計** | 手機、平板、桌面完美適配 |

---

### 🛠️ 技術棧

```
前端：React 18 + TypeScript + Tailwind CSS + Vite
後端：Supabase（PostgreSQL + Auth + Storage）
第三方：Google OAuth / Cloudinary / Gemini API
部署：Vercel
```

---

### 📊 功能模組

- **本地圖書館**：提示詞建立、編輯、分類、搜尋、批量管理
- **全球社群**：發布、收藏、評論、評分、標籤篩選
- **會員系統**：Google 登入、頭像選擇、暱稱自訂
- **成就系統**：15 級等級、3 種徽章、主題/頭像解鎖
- **新手引導**：5 步互動式教學導覽

---

### 💡 適用場景

- AI 繪圖創作者的提示詞管理工具
- 創作者社群平台
- 知識分享 / 內容收藏類應用
- 需要會員等級與成就系統的 SaaS 產品

---

**開發週期**：約 4-6 週  
**適合預算**：中型專案

---

*如有類似專案需求，歡迎聯繫洽談！*
