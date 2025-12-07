
import { GlobalPrompt, Comment, User } from '../types';

const GLOBAL_STORAGE_KEY = 'promptsgo_global_v1';

// Mock seed data
const SEED_GLOBAL_PROMPTS: GlobalPrompt[] = [
  {
    id: 'global-1',
    title: 'Stunning Aurora Borealis',
    description: 'A beautiful night sky scene.',
    positive: 'Aurora borealis, snowy mountains, reflection in lake, starry night, 8k resolution, photorealistic, long exposure.',
    negative: 'blur, noise, daylight',
    note: 'Best with chilly color palette.',
    authorId: 'user_101',
    authorName: 'Alice Art',
    tags: ['Nature', 'Landscape', 'Night'],
    rating: 4.8,
    ratingCount: 12,
    comments: [
      { id: 'c1', userId: 'user_102', userName: 'Bob', content: 'Amazing prompt! Works great on Midjourney.', rating: 5, createdAt: Date.now() - 100000 }
    ],
    views: 150,
    createdAt: Date.now() - 500000,
    updatedAt: Date.now() - 500000
  },
  {
    id: 'global-2',
    title: 'Cyber Samurai',
    description: 'Character design concept.',
    positive: 'Cybernetic samurai, neon armor, katana with laser edge, rainy neo-tokyo background, intricate details, concept art, trending on artstation.',
    authorId: 'anonymous',
    authorName: 'Anonymous',
    tags: ['Sci-Fi', 'Character', 'Cyberpunk'],
    rating: 4.2,
    ratingCount: 8,
    comments: [],
    views: 89,
    createdAt: Date.now() - 200000,
    updatedAt: Date.now() - 200000
  }
];

// Helper to get global prompts
export const getGlobalPrompts = (): GlobalPrompt[] => {
  try {
    const stored = localStorage.getItem(GLOBAL_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(SEED_GLOBAL_PROMPTS));
      return SEED_GLOBAL_PROMPTS;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load global prompts", e);
    return [];
  }
};

// Share a prompt
export const sharePrompt = (prompt: GlobalPrompt): void => {
  const current = getGlobalPrompts();
  const updated = [prompt, ...current];
  localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(updated));
};

// Add comment and rating
export const addComment = (promptId: string, comment: Comment): void => {
  const current = getGlobalPrompts();
  const updated = current.map(p => {
    if (p.id === promptId) {
      const newComments = [comment, ...p.comments];
      // Recalculate rating
      const totalRating = p.rating * p.ratingCount + comment.rating;
      const newCount = p.ratingCount + 1;
      const newRating = parseFloat((totalRating / newCount).toFixed(1));
      
      return {
        ...p,
        comments: newComments,
        rating: newRating,
        ratingCount: newCount
      };
    }
    return p;
  });
  localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(updated));
};

// Basic View Counter increment (optional, just for show)
export const incrementView = (promptId: string): void => {
  const current = getGlobalPrompts();
  const updated = current.map(p => p.id === promptId ? { ...p, views: p.views + 1 } : p);
  localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(updated));
};
