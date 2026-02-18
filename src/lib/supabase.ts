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
    try {
      if (isNative()) {
        const { value } = await Preferences.get({ key });
        console.log('[CapacitorStorage] Get (native):', key, value ? 'exists' : 'null');
        return value;
      }
      const value = localStorage.getItem(key);
      console.log('[CapacitorStorage] Get (web):', key, value ? 'exists' : 'null');
      return value;
    } catch (error) {
      console.error('[CapacitorStorage] Get error:', key, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (isNative()) {
        await Preferences.set({ key, value });
        console.log('[CapacitorStorage] Set (native):', key);
      } else {
        localStorage.setItem(key, value);
        console.log('[CapacitorStorage] Set (web):', key);
      }
    } catch (error) {
      console.error('[CapacitorStorage] Set error:', key, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (isNative()) {
        await Preferences.remove({ key });
        console.log('[CapacitorStorage] Remove (native):', key);
      } else {
        localStorage.removeItem(key);
        console.log('[CapacitorStorage] Remove (web):', key);
      }
    } catch (error) {
      console.error('[CapacitorStorage] Remove error:', key, error);
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
