import { supabase } from './supabaseClient';

export interface NicknameProfile {
  nickname: string | null;
  nicknameIcon: string | null;
  nicknameTokens: number;
  nicknameLevel: number;
}

const toNumber = (v: any, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const getNicknameProfile = async (userId: string): Promise<NicknameProfile | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .select('nickname, nickname_icon, nickname_tokens, nickname_level')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Failed to load nickname profile:', error);
    return null;
  }

  return {
    nickname: (data as any)?.nickname ?? null,
    nicknameIcon: (data as any)?.nickname_icon ?? null,
    nicknameTokens: Math.max(0, toNumber((data as any)?.nickname_tokens, 0)),
    nicknameLevel: Math.max(0, toNumber((data as any)?.nickname_level, 0)),
  };
};

export const ensureNicknameInitialized = async (userId: string, initialTokens: number): Promise<NicknameProfile | null> => {
  if (!supabase) return null;

  const profile = await getNicknameProfile(userId);
  if (!profile) return null;

  // If nickname_tokens is missing/null in DB, profile.nicknameTokens will be 0.
  // Initialize once by setting tokens to initialTokens when it's 0 and user has no nickname yet.
  if (profile.nicknameTokens === 0 && !profile.nickname) {
    const { error } = await supabase.from('users').upsert({
      id: userId,
      nickname_tokens: initialTokens,
      nickname_level: profile.nicknameLevel,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Failed to initialize nickname tokens:', error);
      return profile;
    }

    return {
      ...profile,
      nicknameTokens: initialTokens,
    };
  }

  return profile;
};

export const setNicknameTokens = async (userId: string, tokens: number): Promise<void> => {
  if (!supabase) return;

  const { error } = await supabase.from('users').upsert({
    id: userId,
    nickname_tokens: Math.max(0, Math.floor(tokens)),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('Failed to update nickname tokens:', error);
  }
};

export const saveNickname = async (userId: string, nickname: string, nicknameIcon: string | null): Promise<void> => {
  if (!supabase) return;

  const { error } = await supabase.from('users').upsert({
    id: userId,
    nickname,
    nickname_icon: nicknameIcon,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('Failed to save nickname:', error);
  }
};

export const awardNicknameTokensForLevel = async (userId: string, currentLevel: number): Promise<NicknameProfile | null> => {
  if (!supabase) return null;

  const profile = await getNicknameProfile(userId);
  if (!profile) return null;

  const diff = Math.max(0, Math.floor(currentLevel) - Math.floor(profile.nicknameLevel));
  if (diff <= 0) return profile;

  const nextTokens = profile.nicknameTokens + diff;
  const nextLevel = Math.floor(currentLevel);

  const { error } = await supabase.from('users').upsert({
    id: userId,
    nickname_tokens: nextTokens,
    nickname_level: nextLevel,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('Failed to award nickname tokens:', error);
    return profile;
  }

  return {
    ...profile,
    nicknameTokens: nextTokens,
    nicknameLevel: nextLevel,
  };
};
