// lib/supabase.js - Supabase client configuration
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// createBrowserClient already returns a memoized singleton per browser context,
// so calling this module once is safe — and every importer gets the same instance.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);