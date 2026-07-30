// @ts-nocheck — This file runs on Deno (Supabase Edge Functions), not Node.js.
// VS Code may show errors for Deno globals (Deno.serve, Deno.env) which is expected
// in a Node-based project. The code is correct for the Deno runtime.
// Deploy with: npx supabase functions deploy create-kasir --project-ref <project-ref>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

interface CreateKasirPayload {
  email: string
  password: string
  full_name: string
  phone?: string | null
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // ── 1. Authenticate caller ──────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized: missing token' }, 401)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const callerToken = authHeader.slice(7) // strip "Bearer "
    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(callerToken)

    if (callerError || !caller) {
      return json({ error: 'Unauthorized: invalid session' }, 401)
    }

    if (caller.app_metadata?.role !== 'admin') {
      return json({ error: 'Forbidden: hanya admin yang dapat membuat akun kasir' }, 403)
    }

    // ── 2. Validate payload ────────────────────────────────────────
    let payload: CreateKasirPayload
    try {
      payload = await req.json()
    } catch {
      return json({ error: 'Request body tidak valid' }, 400)
    }

    const { email, password, full_name, phone } = payload

    if (!email?.trim() || !password || !full_name?.trim()) {
      return json({ error: 'email, password, dan full_name wajib diisi' }, 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return json({ error: 'Format email tidak valid' }, 400)
    }

    if (password.length < 8) {
      return json({ error: 'Password minimal 8 karakter' }, 400)
    }

    // ── 3. Create auth user ────────────────────────────────────────
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // kasir can login immediately — no email verification needed
      app_metadata: { role: 'kasir' },
    })

    if (createError) {
      const isAlreadyRegistered =
        createError.message.toLowerCase().includes('already registered') ||
        createError.message.toLowerCase().includes('already exists')
      return json(
        { error: isAlreadyRegistered ? 'Email sudah terdaftar di sistem' : createError.message },
        400,
      )
    }

    const newUserId = newUserData.user.id

    // ── 4. Insert profile row ──────────────────────────────────────
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        role: 'kasir',
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      // Rollback: delete auth user so we don't leave orphaned auth accounts
      await supabaseAdmin.auth.admin.deleteUser(newUserId)
      return json({ error: 'Gagal menyimpan profil kasir. Silakan coba lagi.' }, 500)
    }

    return json({ profile })
  } catch (_err) {
    return json({ error: 'Terjadi kesalahan server. Silakan coba lagi.' }, 500)
  }
})
