import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

let supabaseAdmin = null;

if (supabaseUrl && supabaseSecretKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('[Supabase] Server admin client initialized successfully with SUPABASE_SECRET_KEY');
  } catch (error) {
    console.error('[Supabase] Failed to initialize Supabase server client:', error.message);
  }
} else {
  console.warn(
    '[Supabase] Warning: SUPABASE_URL or SUPABASE_SECRET_KEY missing in server .env. Auth verification will operate in guest mode.'
  );
}

export { supabaseAdmin };
