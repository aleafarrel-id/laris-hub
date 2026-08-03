import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
  throw new Error(
    '[Supabase] VITE_SUPABASE_URL belum dikonfigurasi.',
  )
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  throw new Error(
    '[Supabase] VITE_SUPABASE_ANON_KEY belum dikonfigurasi.',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: localStorage,
  },
  global: {
    headers: {
      'x-app-name': import.meta.env.VITE_APP_NAME ?? 'Laris Hub',
      'x-app-version': import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
