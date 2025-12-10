
import { AppState, Category, Prompt, LanguageCode } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_PROMPTS } from '../constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY = 'promptsgo_data_v1';

const getStorageKey = (userId?: string) => userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;

// Detect browser language
export const detectBrowserLanguage = (): LanguageCode => {
  const browserLang = navigator.language || (navigator as any).userLanguage;

  // Map browser language codes to our supported languages
  if (browserLang.startsWith('zh')) {
    // Chinese (Simplified or Traditional)
    return 'zh-TW';
  } else if (browserLang.startsWith('ja')) {
    // Japanese
    return 'ja';
  } else {
    // Default to English for all other languages
    return 'en';
  }
};

export const loadState = (userId?: string): Partial<AppState> => {
  try {
    const key = getStorageKey(userId);
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      // First load: detect browser language
      const detectedLanguage = detectBrowserLanguage();
      return {
        prompts: DEFAULT_PROMPTS,
        categories: DEFAULT_CATEGORIES,
        theme: 'journal',
        language: detectedLanguage,
        collectedGlobalIds: []
      };
    }
    const parsed = JSON.parse(serializedState);
    
    // Migration for Theme (from isDarkMode boolean)
    if (parsed.isDarkMode !== undefined && !parsed.theme) {
      parsed.theme = parsed.isDarkMode ? 'dark' : 'light';
      delete parsed.isDarkMode;
    }

    // Legacy fallback
    if (!parsed.theme) {
      parsed.theme = 'journal';
    }
    
    if (!parsed.collectedGlobalIds) {
      parsed.collectedGlobalIds = [];
    }

    if (!parsed.categories || parsed.categories.length === 0) {
      // NOTE: We only restore defaults if array is missing.
      // If empty array exists, user might have deleted all intentionally.
      // But for initial load/safety, we can check if it's "undefined".
      // If user has 0 categories, that is allowed.
      if (!parsed.categories) {
         parsed.categories = DEFAULT_CATEGORIES;
      }
    }
    
    // Ensure prompts array exists
    if (!parsed.prompts) {
      parsed.prompts = DEFAULT_PROMPTS;
    }

    return parsed;
  } catch (err) {
    console.error("Could not load state", err);
    return {
      prompts: DEFAULT_PROMPTS,
      categories: DEFAULT_CATEGORIES,
      theme: 'journal',
      collectedGlobalIds: []
    };
  }
};

export const saveState = (state: Partial<AppState>, userId?: string) => {
  try {
    // Only save what we need
    const { prompts, categories, theme, language, collectedGlobalIds } = state;
    const serializedState = JSON.stringify({ prompts, categories, theme, language, collectedGlobalIds });
    const key = getStorageKey(userId);
    localStorage.setItem(key, serializedState);
  } catch (err) {
    console.error("Could not save state", err);
  }
};

export const saveRemoteState = async (userId: string, state: Partial<AppState>) => {
  if (!isSupabaseConfigured() || !userId) return;
  
  const { prompts, categories, theme, language, collectedGlobalIds } = state;
  const data = { prompts, categories, theme, language, collectedGlobalIds };
  
  try {
    const { error } = await supabase!
      .from('users')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', userId);
      
    if (error) {
       console.error("Failed to save remote state:", error);
    }
  } catch (err) {
    console.error("Error saving remote state:", err);
  }
};

export const loadRemoteState = async (userId: string): Promise<Partial<AppState> | null> => {
   if (!isSupabaseConfigured() || !userId) return null;
   
   try {
     const { data, error } = await supabase!
       .from('users')
       .select('data')
       .eq('id', userId)
       .single();
       
     if (error || !data || !data.data) return null;
     
     return data.data as Partial<AppState>;
   } catch (err) {
     console.error("Error loading remote state:", err);
     return null;
   }
};

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};
