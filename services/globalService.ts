import { GlobalPrompt, Comment } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const GLOBAL_STORAGE_KEY = 'promptsgo_global_v1';

// Database row types
interface DbGlobalPrompt {
  id: string;
  title: string;
  description: string | null;
  positive: string;
  negative: string | null;
  note: string | null;
  author_id: string | null;
  author_name: string;
  author_avatar: string | null;
  tags: string[];
  model_tags: string[];
  image: string | null;
  component_images: string[];
  video: string | null;
  rating: number;
  rating_count: number;
  views: number;
  created_at: string;
  updated_at: string;
}

interface DbComment {
  id: string;
  prompt_id: string;
  user_id: string | null;
  user_name: string;
  user_avatar: string | null;
  content: string;
  rating: number;
  created_at: string;
}

// Convert DB row to app type
const dbToGlobalPrompt = (row: DbGlobalPrompt, comments: Comment[] = []): GlobalPrompt => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  positive: row.positive,
  negative: row.negative || undefined,
  note: row.note || undefined,
  authorId: row.author_id || 'anonymous',
  authorName: row.author_name,
  authorAvatar: row.author_avatar,
  tags: row.tags || [],
  modelTags: row.model_tags || [],
  image: row.image || undefined,
  componentImages: row.component_images || [],
  video: row.video || undefined,
  rating: Number(row.rating),
  ratingCount: row.rating_count,
  views: row.views,
  comments,
  collectCount: 0, // Initialize to 0, will be updated from localStorage
  createdAt: new Date(row.created_at).getTime(),
  updatedAt: new Date(row.updated_at).getTime(),
});

const dbToComment = (row: DbComment): Comment => ({
  id: row.id,
  userId: row.user_id || 'anonymous',
  userName: row.user_name,
  userAvatar: row.user_avatar,
  content: row.content,
  rating: row.rating,
  createdAt: new Date(row.created_at).getTime(),
});

// ========== Supabase Implementation ==========

const getGlobalPromptsFromSupabase = async (): Promise<GlobalPrompt[]> => {
  if (!supabase) return [];

  const { data: prompts, error } = await supabase
    .from('global_prompts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prompts:', error);
    return [];
  }

  // Fetch comments for all prompts
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false });

  const commentsByPrompt: Record<string, Comment[]> = {};
  (comments || []).forEach((c: DbComment) => {
    if (!commentsByPrompt[c.prompt_id]) {
      commentsByPrompt[c.prompt_id] = [];
    }
    commentsByPrompt[c.prompt_id].push(dbToComment(c));
  });

  return (prompts || []).map((p: DbGlobalPrompt) =>
    dbToGlobalPrompt(p, commentsByPrompt[p.id] || [])
  );
};

const sharePromptToSupabase = async (prompt: GlobalPrompt): Promise<void> => {
  if (!supabase) return;

  const { error } = await supabase.from('global_prompts').insert({
    id: prompt.id,
    title: prompt.title,
    description: prompt.description || null,
    positive: prompt.positive,
    negative: prompt.negative || null,
    note: prompt.note || null,
    author_id: prompt.authorId === 'anonymous' ? null : prompt.authorId,
    author_name: prompt.authorName,
    author_avatar: prompt.authorAvatar || null,
    tags: prompt.tags,
    model_tags: prompt.modelTags || [],
    image: prompt.image || null,
    component_images: prompt.componentImages || [],
    video: prompt.video || null,
    rating: 0,
    rating_count: 0,
    views: 0,
  });

  if (error) console.error('Error sharing prompt:', error);
};

const updatePromptInSupabase = async (prompt: GlobalPrompt): Promise<void> => {
  if (!supabase) return;

  const { error } = await supabase
    .from('global_prompts')
    .update({
      title: prompt.title,
      description: prompt.description || null,
      positive: prompt.positive,
      negative: prompt.negative || null,
      note: prompt.note || null,
      tags: prompt.tags,
      model_tags: prompt.modelTags || [],
      image: prompt.image || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', prompt.id);

  if (error) console.error('Error updating prompt:', error);
};

const deletePromptInSupabase = async (promptId: string): Promise<void> => {
  if (!supabase) return;

  const { error } = await supabase
    .from('global_prompts')
    .delete()
    .eq('id', promptId);

  if (error) {
    console.error('Error deleting prompt:', error);
    throw new Error(`Failed to delete prompt: ${error.message}`);
  }
};

const addCommentToSupabase = async (promptId: string, comment: Comment): Promise<void> => {
  if (!supabase) return;

  // Insert comment
  const { error: commentError } = await supabase.from('comments').insert({
    prompt_id: promptId,
    user_id: comment.userId === 'anonymous' ? null : comment.userId,
    user_name: comment.userName,
    user_avatar: comment.userAvatar || null,
    content: comment.content,
    rating: comment.rating,
  });

  if (commentError) {
    console.error('Error adding comment:', commentError);
    return;
  }

  // Update prompt rating
  const { data: prompt } = await supabase
    .from('global_prompts')
    .select('rating, rating_count')
    .eq('id', promptId)
    .single();

  if (prompt) {
    const totalRating = prompt.rating * prompt.rating_count + comment.rating;
    const newCount = prompt.rating_count + 1;
    const newRating = parseFloat((totalRating / newCount).toFixed(1));

    await supabase
      .from('global_prompts')
      .update({ rating: newRating, rating_count: newCount })
      .eq('id', promptId);
  }
};

const incrementViewInSupabase = async (promptId: string): Promise<void> => {
  if (!supabase) return;

  const { data: prompt } = await supabase
    .from('global_prompts')
    .select('views')
    .eq('id', promptId)
    .single();

  if (prompt) {
    await supabase
      .from('global_prompts')
      .update({ views: prompt.views + 1 })
      .eq('id', promptId);
  }
};

// ========== LocalStorage Fallback ==========

const getGlobalPromptsFromLocal = (): GlobalPrompt[] => {
  try {
    const stored = localStorage.getItem(GLOBAL_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load global prompts", e);
    return [];
  }
};

const sharePromptToLocal = (prompt: GlobalPrompt): void => {
  const current = getGlobalPromptsFromLocal();
  const updated = [prompt, ...current];
  localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(updated));
};

const updatePromptInLocal = (prompt: GlobalPrompt): void => {
  const current = getGlobalPromptsFromLocal();
  const updated = current.map(p => p.id === prompt.id ? prompt : p);
  localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(updated));
};

const deletePromptInLocal = (promptId: string): void => {
  const current = getGlobalPromptsFromLocal();
  const updated = current.filter(p => p.id !== promptId);
  localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(updated));
};

const addCommentToLocal = (promptId: string, comment: Comment): void => {
  const current = getGlobalPromptsFromLocal();
  const updated = current.map(p => {
    if (p.id === promptId) {
      const newComments = [comment, ...p.comments];
      const totalRating = p.rating * p.ratingCount + comment.rating;
      const newCount = p.ratingCount + 1;
      const newRating = parseFloat((totalRating / newCount).toFixed(1));
      return { ...p, comments: newComments, rating: newRating, ratingCount: newCount };
    }
    return p;
  });
  localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(updated));
};

const incrementViewInLocal = (promptId: string): void => {
  const current = getGlobalPromptsFromLocal();
  const updated = current.map(p => p.id === promptId ? { ...p, views: p.views + 1 } : p);
  localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(updated));
};

// ========== Exported API ==========

export const getUniqueModelTags = async (): Promise<string[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from('global_prompts')
    .select('model_tags');

  if (error || !data) return [];

  const tags = new Set<string>();
  data.forEach((row: any) => {
    if (Array.isArray(row.model_tags)) {
        row.model_tags.forEach((tag: string) => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
};

export const getUniqueTags = async (): Promise<string[]> => {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase!
    .from('global_prompts')
    .select('tags');

  if (error || !data) return [];

  const tags = new Set<string>();
  data.forEach((row: any) => {
    if (Array.isArray(row.tags)) {
        row.tags.forEach((tag: string) => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
};

export const getGlobalPrompts = async (): Promise<GlobalPrompt[]> => {
  if (isSupabaseConfigured()) {
    return getGlobalPromptsFromSupabase();
  }
  return getGlobalPromptsFromLocal();
};

export const sharePrompt = async (prompt: GlobalPrompt): Promise<void> => {
  if (isSupabaseConfigured()) {
    await sharePromptToSupabase(prompt);
  } else {
    sharePromptToLocal(prompt);
  }
};

export const updatePrompt = async (prompt: GlobalPrompt): Promise<void> => {
  if (isSupabaseConfigured()) {
    await updatePromptInSupabase(prompt);
  } else {
    updatePromptInLocal(prompt);
  }
};

export const deletePrompt = async (promptId: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    await deletePromptInSupabase(promptId);
  } else {
    deletePromptInLocal(promptId);
  }
};

export const addComment = async (promptId: string, comment: Comment): Promise<void> => {
  if (isSupabaseConfigured()) {
    await addCommentToSupabase(promptId, comment);
  } else {
    addCommentToLocal(promptId, comment);
  }
};

export const incrementView = async (promptId: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    await incrementViewInSupabase(promptId);
  } else {
    incrementViewInLocal(promptId);
  }
};

// ========== Banners API ==========

export const getBanners = async (): Promise<{id: string, url: string}[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from('app_banners')
        .select('id, image_url')
        .order('created_at', { ascending: true });
    
    if (error) {
        console.warn("Failed to fetch banners (check if table 'app_banners' exists):", error);
        return [];
    }
    return data.map((b: any) => ({ id: b.id, url: b.image_url }));
};

export const addBanner = async (url: string): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('app_banners').insert({ image_url: url });
    if (error) console.error("Failed to add banner:", error);
};

export const deleteBanner = async (id: string): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.from('app_banners').delete().eq('id', id);
    if (error) console.error("Failed to delete banner:", error);
};

// ========== Sitemap ==========

export const generateSitemapXML = async (): Promise<string> => {
  const prompts = await getGlobalPrompts();
  const baseUrl = window.location.origin;
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Home page
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}</loc>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // Prompts
  prompts.forEach(prompt => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/?promptId=${prompt.id}</loc>\n`;
    xml += `    <lastmod>${new Date(prompt.updatedAt || prompt.createdAt).toISOString()}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += '</urlset>';
  return xml;
};
