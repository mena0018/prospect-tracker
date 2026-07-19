import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

import { AppShell } from '@/components/layout/app-shell'
import { toInitials } from '@/lib/utils'

// Read on the server so the sidebar renders in its persisted state on first paint.
const getSidebarState = createServerFn().handler(() => getCookie('sidebar_state') !== 'false')

export const Route = createFileRoute('/_authed/app')({
  loader: () => getSidebarState(),
  component: Dashboard
})

function Dashboard() {
  const { user } = Route.useRouteContext()
  const defaultSidebarOpen = Route.useLoaderData()

  const subtitle = user?.email ?? 'N/C'
  const name = user?.fullName ?? user?.email.split('@')[0] ?? 'N/C'
  const initials = toInitials(name)

  return (
    <AppShell
      profile={{ name, subtitle, initials }}
      headerSubtitle="11 opportunités actives"
      defaultSidebarOpen={defaultSidebarOpen}
    >
      <div className="h-full" />
    </AppShell>
  )
}
