
import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars in different environments (Vite vs others)
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    return process.env[key];
  }
  return undefined;
};

// Use a valid URL structure for the fallback to prevent "Invalid URL" crash
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
