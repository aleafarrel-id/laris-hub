import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    // Check auth state and redirect accordingly
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw redirect({ to: '/login' })
    }

    // Get profile to determine role
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const profile = data as { role: 'admin' | 'kasir' } | null

    if (profile?.role === 'admin') {
      throw redirect({ to: '/dashboard' })
    }

    throw redirect({ to: '/kasir' })
  },
  component: () => null,
})
