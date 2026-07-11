import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase env vars are not set (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY). ' +
      'Copy .env.example to .env and fill in your project values. Falling back to a placeholder ' +
      'client so the UI can still render — auth/data calls will fail until this is configured.'
  );
}

// createClient() throws synchronously on an empty/invalid URL, which would
// otherwise crash the whole app at import time before any screen can render.
// A syntactically valid placeholder lets the UI mount; real requests will
// just fail (caught by each api/* call site) until real credentials are set.
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
