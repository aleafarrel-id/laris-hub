// @ts-nocheck - Deno runtime (Supabase Edge Function)
// Deploy: npx supabase functions deploy update-cashier --project-ref <ref>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-app-name, x-app-version, x-cashier-id',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

interface UpdateCashierBody {
  id: string
  full_name?: string
  phone?: string | null
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

    if (req.method === 'GET') {
      const targetId = req.headers.get('x-cashier-id')
      if (!targetId) return json({ error: 'Header x-cashier-id diperlukan' }, 400)

      const {
        data: { user: targetUser },
      } = await supabaseAdmin.auth.admin.getUserById(targetId)

      if (!targetUser) {
        return json({
          id: targetId,
          email: null,
          last_sign_in_at: null,
          created_at: new Date().toISOString(),
        })
      }

      return json({
        id: targetUser.id,
        email: targetUser.email ?? null,
        last_sign_in_at: targetUser.last_sign_in_at ?? null,
        created_at: targetUser.created_at,
      })
    }

    if (req.method === 'PATCH') {
      let body: UpdateCashierBody
      try {
        body = await req.json()
      } catch {
        return json({ error: 'Request body tidak valid' }, 400)
      }

      const { id, full_name, phone, email, password } = body
      if (!id) return json({ error: 'id cashier diperlukan' }, 400)

      const {
        data: { user: targetUser },
      } = await supabaseAdmin.auth.admin.getUserById(id)

      if (targetUser && targetUser.app_metadata?.role === 'admin' && targetUser.id !== caller.id) {
        return json({ error: 'Tidak dapat mengubah akun admin lain' }, 403)
      }

      const authUpdates: Record<string, unknown> = {}
      if (email?.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          return json({ error: 'Format email tidak valid' }, 400)
        }
        authUpdates.email = email.trim().toLowerCase()
        authUpdates.email_confirm = true
      }
      if (password) {
        if (password.length < 8) return json({ error: 'Password minimal 8 karakter' }, 400)
        authUpdates.password = password
      }

      if (targetUser && Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates)
        if (authError) return json({ error: authError.message }, 400)
      } else if (!targetUser && Object.keys(authUpdates).length > 0) {
        return json({ error: 'Akun auth tidak ditemukan, gagal mengubah email/password' }, 404)
      }

      const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (full_name?.trim()) profileUpdates.full_name = full_name.trim()
      if (phone !== undefined) profileUpdates.phone = phone?.trim() || null

      const { data: updatedProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id)
        .select()
        .single()

      if (profileError) return json({ error: profileError.message }, 500)

      return json({ profile: updatedProfile })
    }

    if (req.method === 'DELETE') {
      let body: { id: string }
      try {
        body = await req.json()
      } catch {
        return json({ error: 'Request body tidak valid' }, 400)
      }

      const { id } = body
      if (!id) return json({ error: 'id cashier diperlukan' }, 400)

      if (id === caller.id) return json({ error: 'Tidak dapat menghapus akun sendiri' }, 403)

      const {
        data: { user: targetUser },
      } = await supabaseAdmin.auth.admin.getUserById(id)

      if (targetUser && targetUser.app_metadata?.role === 'admin') {
        return json({ error: 'Tidak dapat menghapus akun admin' }, 403)
      }

      const { count, error: countError } = await supabaseAdmin
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('recorded_by', id)

      if (countError) return json({ error: 'Gagal memeriksa data transaksi' }, 500)

      if (count && count > 0) {
        return json(
          {
            error: `Kasir ini memiliki ${count} transaksi yang tersimpan. Untuk menjaga integritas data, gunakan fitur Tangguhkan saja.`,
            has_transactions: true,
            transaction_count: count,
          },
          409,
        )
      }

      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', id)

      if (profileDeleteError) return json({ error: profileDeleteError.message }, 500)

      if (targetUser) {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id)
        if (authDeleteError) {
          console.error('Auth user deletion failed after profile delete:', authDeleteError)
          return json({ error: 'Profil dihapus namun gagal menghapus akun auth.' }, 500)
        }
      }

      return json({ success: true, deleted_id: id })
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (_err) {
    return json({ error: 'Terjadi kesalahan server' }, 500)
  }
})
