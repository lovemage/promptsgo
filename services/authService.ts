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
  
  const profile = {
    id: user.id,
    email: user.email,
    full_name: user.displayName,
    avatar_url: user.photoURL,
    updated_at: new Date().toISOString(),
  };

  // Upsert into 'users' table to satisfy foreign key constraints
  const { error } = await supabase.from('users').upsert(profile);
  
  if (error) {
      console.warn("Failed to ensure user profile:", error);
      // If column missing, try minimal insert (just ID) to satisfy Foreign Key
      if (error.message?.includes("column") || error.code === 'PGRST204') {
          const { error: minError } = await supabase.from('users').upsert({ id: user.id });
          if (minError) console.error("Failed minimal profile upsert:", minError);
      }
  }
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
    /* 
       NOTE: We rely on Supabase "Site URL" configuration by default.
       If you want to support Vercel Preview URLs, add them to Supabase "Redirect URLs"
       and uncomment the options block below.
    */
    // options: {
    //   redirectTo: redirectUrl
    // }
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
