import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client initialization.
 *
 * ✅ WHERE TO PASTE KEYS:
 *  - Create a .env file at the project root
 *  - Add the following entries:
 *      VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
 *      VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
 *
 * These values are read from import.meta.env (Vite).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  throw new Error(
    'Supabase is not configured: both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file.'
  )
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
