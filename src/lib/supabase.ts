import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import type { Database } from './types';
import { isNative } from './capacitor';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const capacitorStorage = {
  getItem: async (key: string) => {
    if (isNative()) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (isNative()) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (isNative()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: capacitorStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
