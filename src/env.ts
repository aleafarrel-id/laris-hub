/**
 * Build-time environment variable validation.
 * Uses @t3-oss/env-core + zod to validate all required env vars.
 *
 * If any required variable is missing or invalid, the build will FAIL
 * with a clear error message before reaching production.
 *
 * Usage: import '@/env' at the very top of main.tsx to trigger validation
 * on app startup. The supabase client also uses the validated values.
 */
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Client-side environment variables exposed to the browser via Vite.
   * All must be prefixed with VITE_.
   */
  clientPrefix: 'VITE_',
  client: {
    VITE_SUPABASE_URL: z
      .string()
      .url('VITE_SUPABASE_URL must be a valid URL')
      .refine(
        (val) => val !== 'https://your-project-id.supabase.co',
        'VITE_SUPABASE_URL is still set to the placeholder value. Configure a real Supabase project URL.',
      ),
    VITE_SUPABASE_ANON_KEY: z
      .string()
      .min(1, 'VITE_SUPABASE_ANON_KEY is required')
      .refine(
        (val) => val !== 'your-anon-key-here',
        'VITE_SUPABASE_ANON_KEY is still set to the placeholder value. Configure a real Supabase anon key.',
      ),
    VITE_APP_NAME: z.string().min(1).default('Laris Hub'),
    VITE_APP_VERSION: z.string().min(1).default('1.0.0'),
    VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('production'),
  },
  /**
   * Provide runtime values from Vite's import.meta.env.
   * This is how @t3-oss/env-core reads env vars in a Vite project.
   */
  runtimeEnv: {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  },
  /**
   * Skip validation in test environments or when explicitly disabled.
   * Set VITE_SKIP_ENV_VALIDATION=true in CI test runs if needed.
   */
  skipValidation: import.meta.env.VITE_SKIP_ENV_VALIDATION === 'true',
  /**
   * Makes it so that empty strings are treated as undefined.
   * This prevents misconfigured .env files with blank values from passing.
   */
  emptyStringAsUndefined: true,
})
