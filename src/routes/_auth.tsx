import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

// ============================================================
// _auth — Layout Route Group (authentication gate)
// All routes nested under _auth/ require authentication.
// beforeLoad runs on every navigation to protected routes.
// ============================================================

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthLayout,
})

function AuthLayout() {
  const { profile } = useAuth()

  // Unified Responsive Layout for all roles
  // - Sidebar on desktop (md+)
  // - BottomNav on mobile (< md)
  return (
    <div className="flex min-h-dvh bg-neutral-50/50">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar role={profile?.role} userName={profile?.full_name} />

      {/* Main Content */}
      <div className="flex-1 min-w-0 md:ml-64 pb-[72px] md:pb-0 flex flex-col">
        <main className="min-h-dvh flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav (hidden on desktop) */}
      <BottomNav role={profile?.role} />
    </div>
  )
}
