import { calculateBadgeInfo } from './badgeUtils';
import { User } from '../types';

export const DEFAULT_AVATAR_URL = '/avators_promptgp/ava1.PNG';

const userAvatarKey = (userId: string) => `promptsgo_user_avatar_${userId}`;

export const getStoredUserAvatar = (userId: string): string | null => {
  try {
    return localStorage.getItem(userAvatarKey(userId));
  } catch {
    return null;
  }
};

export const setStoredUserAvatar = (userId: string, avatarUrl: string) => {
  try {
    localStorage.setItem(userAvatarKey(userId), avatarUrl);
  } catch {
    // ignore
  }
};

export const getEffectiveUserAvatar = (user: User | null): string | null => {
  if (!user?.id) return null;
  return getStoredUserAvatar(user.id) || user.photoURL || DEFAULT_AVATAR_URL;
};

export const getEffectiveBadgeLevel = (promptCount: number, language: string) => {
  const level = calculateBadgeInfo(promptCount, language).level;
  return Math.max(1, level);
};

export const buildDefaultAvatarList = (): { id: string; url: string }[] => {
  const list: { id: string; url: string }[] = [];
  for (let i = 1; i <= 18; i++) {
    list.push({ id: `ava${i}`, url: `/avators_promptgp/ava${i}.PNG` });
  }
  for (let i = 1; i <= 16; i++) {
    list.push({ id: `avb${i}`, url: `/avators_promptgp/avb${i}.PNG` });
  }
  return list;
};

export const isDefaultAvatarUnlocked = (avatarId: string, level: number) => {
  const m = avatarId.match(/^(ava|avb)(\d+)$/);
  if (!m) return false;
  const prefix = m[1];
  const n = Number(m[2]);

  if (prefix === 'ava') {
    if (level >= 3) return n >= 1 && n <= 18;
    if (level === 2) return n >= 1 && n <= 12;
    if (level === 1) return n >= 1 && n <= 6;
    return false;
  }

  if (prefix === 'avb') {
    if (level >= 5) return n >= 1 && n <= 16;
    if (level === 4) return n >= 1 && n <= 6;
    return false;
  }

  return false;
};
