
export type LanguageCode = 'en' | 'zh-TW' | 'ja';
export type ThemeId = 'light' | 'dark' | 'binder' | 'journal' | 'glass' | 'royal';

export interface User {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface Prompt {
  id: string;
  title: string;
  description?: string;
  positive: string;
  negative?: string;
  note?: string; 
  categoryIds: string[];
  modelTags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  content: string;
  rating: number; // 1-5, 0 for reply
  media?: string | null; // Image or video URL
  createdAt: number;
}

export interface GlobalPrompt extends Omit<Prompt, 'categoryIds'> {
  authorId: string;
  authorName: string; // 'Anonymous' if hidden
  authorAvatar?: string | null;
  tags: string[];
  modelTags?: string[];
  image?: string; // Result Image
  componentImages?: string[]; // Up to 4 component images
  video?: string; // Optional video
  sourceUrl?: string; // Original source URL
  rating: number; // Average rating
  ratingCount: number;
  comments: Comment[];
  views: number;
  collectCount?: number; // Number of users who collected this
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind class like 'bg-blue-500'
  icon: string; // Lucide icon name
}

export interface Dictionary {
  appTitle: string;
  searchPlaceholder: string;
  newPrompt: string;
  categories: string;
  allPrompts: string; // Renamed to "My Library" contextually if needed, or keep distinct
  globalPrompts: string; // New
  myLibrary: string;     // New
  localPrompts: string;  // New - subtitle for local prompts
  uncategorized: string;
  edit: string;
  delete: string;
  copy: string;
  copied: string;
  save: string;
  cancel: string;
  title: string;
  description: string;
  positivePrompt: string;
  negativePrompt: string;
  note: string;
  notePlaceholder: string;
  selectCategories: string;
  noPrompts: string;
  refineWithAI: string;
  refining: string;
  confirmDelete: string;
  manageCategories: string;
  addCategory: string;
  settings: string;
  language: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  themeBinder: string;
  themeJournal: string;
  themeGlass: string;
  themeRoyal: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  create: string;
  login: string;
  logout: string;
  share: string; // New
  shareToGlobal: string; // New
  shareDescription: string;
  anonymous: string;
  tags: string;
  tagsPlaceholder: string;
  uploadImage: string;
  publish: string;
  comments: string;
  writeComment: string;
  noComments: string;
  loginToComment: string;
    rating: string;
    image: string;
    source: string;
    originalSourceUrl: string;
    termsOfService: string;
    privacyPolicy: string;
    webViewWarningTitle: string;
    webViewWarningMessage: string;
    webViewWarningMessageGeneric: string;
    webViewWarningInstructions: string;
    webViewWarningClose: string;
}

export interface AppState {
  prompts: Prompt[];
  categories: Category[];
  searchQuery: string;
  selectedCategoryId: string | null;
  language: LanguageCode;
  theme: ThemeId;
  collectedGlobalIds: string[];
}
