import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

import { ErrorState } from '@/components/error-state'
import { AppShell } from '@/components/layout/app-shell'
import { toDisplayName, toInitials } from '@/lib/utils'

// Read on the server so the sidebar renders in its persisted state on first paint.
const getSidebarState = createServerFn().handler(() => getCookie('sidebar_state') !== 'false')

export const Route = createFileRoute('/_authed/app')({
  loader: () => getSidebarState(),
  component: Dashboard,
  errorComponent: DashboardError
})

function Dashboard() {
  const defaultSidebarOpen = Route.useLoaderData()
  const { user } = Route.useRouteContext()

  const name = toDisplayName(user.fullName)
  const initials = toInitials(user.fullName)

  return (
    <AppShell
      headerSubtitle="11 opportunités actives"
      defaultSidebarOpen={defaultSidebarOpen}
      profile={{ name, subtitle: user.email, initials, avatarUrl: user.avatarUrl }}
    >
      <div className="h-full" />
    </AppShell>
  )
}

function DashboardError() {
  const router = useRouter()

  return (
    <ErrorState
      description="Impossible de charger votre tableau de bord. Réessayez dans un instant."
      onRetry={() => router.invalidate()}
    />
  )
}
