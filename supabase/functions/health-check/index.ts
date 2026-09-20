// @ts-nocheck - Deno runtime (Supabase Edge Functions)
/**
 * health-check - Database keep-alive endpoint
 *
 * Performs a lightweight database query to prevent Supabase from pausing
 * the project due to inactivity (free tier pauses after 7 days).
 *
 * Intended to be called by an external cron service (e.g. cron-job.org).
 * No authentication required - deployed with --no-verify-jwt.
 *
 * Endpoint: GET /functions/v1/health-check
 *
 * Deploy:
 *   npx supabase functions deploy health-check \
 *     --project-ref owfxcigseyvoiksqcxel \
 *     --no-verify-jwt
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types

interface HealthCheckResponse {
  ok: boolean
  timestamp: string
  latency_ms: number
  error?: string
}

// Helpers

function json(body: HealthCheckResponse, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Handler

Deno.serve(async (_req: Request): Promise<Response> => {
  const startedAt = Date.now()
  const timestamp = new Date().toISOString()

  // Only accept GET requests
  if (_req.method !== 'GET') {
    return json({ ok: false, timestamp, latency_ms: 0, error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseAnonKey) {
    return json(
      { ok: false, timestamp, latency_ms: Date.now() - startedAt, error: 'Missing environment variables' },
      500,
    )
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Lightweight probe - touches the database without scanning meaningful data.
    // RLS policies apply; anon key only has SELECT on public rows (if any).
    const { error } = await supabase.from('profiles').select('id').limit(1)

    if (error) {
      console.error('[health-check] Database probe failed:', error.message)
      return json(
        { ok: false, timestamp, latency_ms: Date.now() - startedAt, error: error.message },
        500,
      )
    }

    const latency_ms = Date.now() - startedAt
    console.log(`[health-check] ok — ${latency_ms}ms`)

    return json({ ok: true, timestamp, latency_ms }, 200)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error'
    console.error('[health-check] Unhandled exception:', message)
    return json(
      { ok: false, timestamp, latency_ms: Date.now() - startedAt, error: message },
      500,
    )
  }
})
