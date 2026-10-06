import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

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
