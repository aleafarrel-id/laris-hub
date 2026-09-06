import { createClient } from '@supabase/supabase-js'
import { env } from '@/env'
import type { Database } from '@/types/database.types'

export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: localStorage,
  },
  global: {
    headers: {
      'x-app-name': env.VITE_APP_NAME,
      'x-app-version': env.VITE_APP_VERSION,
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
