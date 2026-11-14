import { createClient } from '@supabase/supabase-js'

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {})

const url = (
  env.VITE_SUPABASE_URL ||
  env.SUPABASE_URL
)?.trim()

const publishableKey = (
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.SUPABASE_KEY
)?.trim()

export const supabaseConfigurationError = (!url || !publishableKey)
  ? 'Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_PUBLISHABLE_KEY.'
  : ''

export const supabase = supabaseConfigurationError
  ? null
  : createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })

export function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigurationError)
  return supabase
}
