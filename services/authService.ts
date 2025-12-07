
import { User } from '../types';

const USER_STORAGE_KEY = 'promptsgo_auth_user';

export const mockUser: User = {
  id: 'user_mock_123',
  displayName: 'Demo User',
  email: 'demo@promptsgo.local',
  photoURL: null
};

// Simple event emitter for auth state
type AuthListener = (user: User | null) => void;
let listeners: AuthListener[] = [];
let currentUser: User | null = null;

// Initialize from storage
try {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (stored) {
    currentUser = JSON.parse(stored);
  }
} catch (e) {
  console.error("Failed to parse auth user", e);
}

const notifyListeners = () => {
  listeners.forEach(l => l(currentUser));
};

export const signInWithGoogle = async (): Promise<void> => {
  // Simulate network delay to feel like a real request
  await new Promise(resolve => setTimeout(resolve, 800));
  currentUser = mockUser;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
  notifyListeners();
};

export const signOut = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  currentUser = null;
  localStorage.removeItem(USER_STORAGE_KEY);
  notifyListeners();
};

export const onAuthStateChanged = (callback: AuthListener) => {
  listeners.push(callback);
  // Immediate callback with current state
  callback(currentUser);
  
  // Return Unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};
