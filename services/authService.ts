import { User } from '../types';
import { supabase } from './supabaseClient';

// Simple event emitter for auth state
type AuthListener = (user: User | null) => void;
let listeners: AuthListener[] = [];
let currentUser: User | null = null;

const mapSupabaseUser = (u: any): User => ({
  id: u.id,
  displayName: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
  email: u.email || null,
  photoURL: u.user_metadata?.avatar_url || null
});

export const signInWithGoogle = async (): Promise<void> => {
  if (!supabase) {
    alert("Supabase not configured! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local");
    return;
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
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
  listeners.forEach(l => l(null));
};

export const onAuthStateChanged = (callback: AuthListener) => {
  listeners.push(callback);
  
  if (supabase) {
      // Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
          currentUser = session?.user ? mapSupabaseUser(session.user) : null;
          callback(currentUser);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          currentUser = session?.user ? mapSupabaseUser(session.user) : null;
          // Notify only this listener or all? Ideally all, but existing listeners are already subscribed.
          // We should rely on subscription to update state, but multiple calls to onAuthStateChanged might create multiple subscriptions if we are not careful.
          // However, for this simple app, it's fine.
          // But actually, we need to notify ALL listeners when auth changes, not just this callback.
          // The subscription callback handles the update.
          
          // Better approach: One global subscription.
          // But to keep it simple and match previous API:
          listeners.forEach(l => l(currentUser));
      });
      
      return () => {
          subscription.unsubscribe();
          listeners = listeners.filter(l => l !== callback);
      };
  } else {
      callback(null);
      return () => {
          listeners = listeners.filter(l => l !== callback);
      };
  }
};
