import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aqfmrmzpeaqwgrilerdg.supabase.co';
const supabaseAnonKey = 'sb_publishable_bUGzCKH4xcCgWpmfwe7Bmw_JJ028Ge7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
