// @ts-nocheck - Deno runtime (Supabase Edge Function)
// Deploy: npx supabase functions deploy create-cashier --project-ref <ref>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-name, x-app-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

interface CreateCashierPayload {
  email: string
  password: string
  full_name: string
  phone?: string | null
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const callerToken = authHeader.slice(7)
    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseAdmin.auth.getUser(callerToken)

    if (callerError || !caller) return json({ error: 'Unauthorized' }, 401)
    if (caller.app_metadata?.role !== 'admin') {
      return json({ error: 'Forbidden: hanya admin yang dapat membuat akun cashier' }, 403)
    }

    let payload: CreateCashierPayload
    try {
      payload = await req.json()
    } catch {
      return json({ error: 'Request body tidak valid' }, 400)
    }

    const { email, password, full_name, phone } = payload

    if (!email?.trim() || !password || !full_name?.trim()) {
      return json({ error: 'email, password, dan full_name wajib diisi' }, 400)
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return json({ error: 'Format email tidak valid' }, 400)
    }

    if (password.length < 8) {
      return json({ error: 'Password minimal 8 karakter' }, 400)
    }

    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      app_metadata: { role: 'cashier' },
    })

    if (createError) {
      const alreadyExists =
        createError.message.toLowerCase().includes('already registered') ||
        createError.message.toLowerCase().includes('already exists')
      return json(
        { error: alreadyExists ? 'Email sudah terdaftar di sistem' : createError.message },
        400,
      )
    }

    const newUserId = newUserData.user.id

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        role: 'cashier',
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return json({ error: 'Gagal menyimpan profil cashier. Silakan coba lagi.' }, 500)
    }

    return json({ profile })
  } catch (_err) {
    return json({ error: 'Terjadi kesalahan server. Silakan coba lagi.' }, 500)
  }
})
