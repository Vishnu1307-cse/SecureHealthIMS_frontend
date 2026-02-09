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
  // Intentionally loud to avoid silent auth failures in production builds.
  console.warn('Missing Supabase env vars. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

const safeUrl = supabaseUrl || 'https://fkqhsgweypbrafwjmnmj.supabase.co'
const safeKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrcWhzZ3dleXBicmFmd2ptbm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODYwNzAsImV4cCI6MjA4Mzk2MjA3MH0.MW5PlxFbsJh26gRchte8I0g6mdSiNAWwid27eLty5Pg'

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
