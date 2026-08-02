import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      // Security: only pass internal paths as redirect to prevent open redirect.
      const href = location.href
      const safeRedirect = href.startsWith('/') ? href : '/login'
      throw redirect({
        to: '/login',
        search: { redirect: safeRedirect },
      })
    }

    // Security: Check if user is active. Suspended users should not pass the guard.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', session.user.id)
      .single()

    if (profileError?.code === 'PGRST116' || profile?.is_active === false) {
      await supabase.auth.signOut()
      throw redirect({ to: '/login' })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const { profile } = useAuth()

  useEffect(() => {
    document.body.style.setProperty('--sidebar-offset', 'var(--layout-sidebar-width)')
    return () => {
      document.body.style.setProperty('--sidebar-offset', '0px')
    }
  }, [])

  return (
    <div className="flex min-h-dvh bg-neutral-50/50">
      <Sidebar role={profile?.role} userName={profile?.full_name} />

      <div className="flex-1 min-w-0 md:ml-64 pb-[72px] md:pb-0 flex flex-col">
        <main className="min-h-dvh flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>

      <BottomNav role={profile?.role} />
    </div>
  )
}
