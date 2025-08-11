import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase admin configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});
