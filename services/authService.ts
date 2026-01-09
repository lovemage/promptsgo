import { User } from '../types';
import { supabase } from './supabaseClient';

type AuthListener = (user: User | null) => void;
let listeners: AuthListener[] = [];
let currentUser: User | null = null;
let initialized = false;

const mapSupabaseUser = (u: any): User => ({
  id: u.id,
  displayName: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
  email: u.email || null,
  photoURL: u.user_metadata?.avatar_url || null
});

const notifyListeners = () => {
  listeners.forEach(l => l(currentUser));
};

const ensureUserProfile = async (user: User) => {
  if (!supabase) return;

  const now = new Date().toISOString();

  // 1) Ensure a row exists (and keep basic profile fields in sync)
  // Use explicit onConflict to avoid PostgREST 409 conflicts.
  // IMPORTANT:
  // Do NOT blindly write email on every login.
  // In this project the users table commonly has a unique constraint on email.
  // If an old row exists with the same email (different id), an upsert that includes email
  // will fail with 23505 users_email_key and block profile initialization.
  const baseProfile: Record<string, any> = {
    id: user.id,
    full_name: user.displayName,
    updated_at: now,
  };

  const { error: upsertError } = await supabase
    .from('users')
    .upsert(baseProfile, { onConflict: 'id' });

  if (upsertError) {
    console.warn('Failed to ensure user profile:', {
      code: (upsertError as any).code,
      message: upsertError.message,
      details: (upsertError as any).details,
      hint: (upsertError as any).hint,
    });
    // If column missing, try minimal insert (just ID) to satisfy Foreign Key
    if (upsertError.message?.includes('column') || (upsertError as any).code === 'PGRST204') {
      const { error: minError } = await supabase.from('users').upsert({ id: user.id }, { onConflict: 'id' });
      if (minError) console.error('Failed minimal profile upsert:', minError);
    }
    return;
  }

  // 2) Initialize avatar_url from provider photoURL ONLY if DB avatar_url is null.
  // This prevents overwriting a user-selected custom avatar.
  if (user.photoURL) {
    const { error: avatarInitError } = await supabase
      .from('users')
      .update({ avatar_url: user.photoURL, updated_at: now })
      .eq('id', user.id)
      .is('avatar_url', null);

    if (avatarInitError) {
      // This can fail under strict RLS; ignore but keep a useful log.
      console.warn('Failed to init avatar_url from provider photoURL:', {
        code: (avatarInitError as any).code,
        message: avatarInitError.message,
        details: (avatarInitError as any).details,
      });
    }
  }

  // done
};

const updateCurrentUser = async (session: any) => {
  const newUser = session?.user ? mapSupabaseUser(session.user) : null;
  // Simple check to avoid unnecessary updates/loops if object identity changes but content is same
  // But for now, just updating is fine.
  if (JSON.stringify(newUser) !== JSON.stringify(currentUser)) {
    currentUser = newUser;
    notifyListeners();

    if (currentUser) {
      await ensureUserProfile(currentUser);
    }
  }
};

// Initialize Supabase listener once
if (supabase && !initialized) {
  initialized = true;

  // Check initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    updateCurrentUser(session);
  });

  // Subscribe to changes
  supabase.auth.onAuthStateChange((_event, session) => {
    updateCurrentUser(session);
  });
}

export const signInWithGoogle = async (): Promise<void> => {
  if (!supabase) {
    alert("Supabase not configured! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local");
    return;
  }

  const redirectUrl = window.location.origin;
  console.log("Initiating Google Login with redirect to:", redirectUrl);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });
  if (error) {
    console.error("Login failed", error);
    alert("Login failed: " + error.message);
  }
};

export const signOut = async (): Promise<void> => {
  if (!supabase) return;
  await supabase.auth.signOut();
  currentUser = null;
  notifyListeners();
};

export const updateUserAvatarUrl = async (userId: string, avatarUrl: string): Promise<void> => {
  if (!supabase) return;

  const { error } = await supabase.from('users').upsert({
    id: userId,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('Failed to update user avatar:', error);
  }
};

export const onAuthStateChanged = (callback: AuthListener) => {
  listeners.push(callback);
  // Send current state immediately
  callback(currentUser);

  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};
