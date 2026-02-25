// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';
import type { Database } from './types';
import { isNative } from './capacitor';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * ✅ WEB: gebruik sync localStorage (meest stabiel voor supabase-js + functions.invoke)
 * ✅ NATIVE: gebruik Capacitor Preferences (async)
 *
 * Belangrijk: supabase-js werkt het meest voorspelbaar met sync storage op web.
 */
const webStorage: Storage = localStorage;

const nativeStorage = {
  getItem: async (key: string) => {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  },
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value });
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key });
  },
};

/**
 * We kiezen storage op basis van platform.
 * Op web géén async wrapper gebruiken.
 */
const storage = isNative() ? (nativeStorage as any) : webStorage;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    // op web meestal true, op native kan false maar true is ook oké
    detectSessionInUrl: !isNative(),
  },
});