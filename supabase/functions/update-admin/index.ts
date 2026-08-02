// @ts-nocheck - Deno runtime (Supabase Edge Function)
// Deploy: npx supabase functions deploy update-admin --project-ref <ref>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-name, x-app-version',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

interface UpdateAdminBody {
  email?: string
  password?: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseAdmin.auth.getUser(authHeader.slice(7))

    if (callerError || !caller) return json({ error: 'Unauthorized' }, 401)
    if (caller.app_metadata?.role !== 'admin') return json({ error: 'Forbidden' }, 403)

    if (req.method === 'PATCH') {
      let body: UpdateAdminBody
      try {
        body = await req.json()
      } catch {
        return json({ error: 'Request body tidak valid' }, 400)
      }

      const { email, password } = body
      const id = caller.id

      const authUpdates: Record<string, unknown> = {}
      if (email?.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          return json({ error: 'Format email tidak valid' }, 400)
        }
        authUpdates.email = email.trim().toLowerCase()
        authUpdates.email_confirm = true // Bypass email verification for fake emails
      }
      if (password) {
        if (password.length < 8) return json({ error: 'Password minimal 8 karakter' }, 400)
        authUpdates.password = password
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates)
        if (authError) return json({ error: authError.message }, 400)
      } else {
        return json({ error: 'Tidak ada data kredensial yang diperbarui' }, 400)
      }

      return json({ success: true })
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (_err) {
    return json({ error: 'Terjadi kesalahan server' }, 500)
  }
})
