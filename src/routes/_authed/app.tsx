import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

import { AppShell } from '@/components/layout/app-shell'
import { toDisplayName, toInitials } from '@/lib/utils'

// Read on the server so the sidebar renders in its persisted state on first paint.
const getSidebarState = createServerFn().handler(() => getCookie('sidebar_state') !== 'false')

export const Route = createFileRoute('/_authed/app')({
  loader: () => getSidebarState(),
  component: Dashboard
})

function Dashboard() {
  const defaultSidebarOpen = Route.useLoaderData()
  const { user } = Route.useRouteContext()

  const name = toDisplayName(user.fullName)
  const initials = toInitials(user.fullName)

  return (
    <AppShell
      profile={{ name, subtitle: user.email, initials }}
      headerSubtitle="11 opportunités actives"
      defaultSidebarOpen={defaultSidebarOpen}
    >
      <div className="h-full" />
    </AppShell>
  )
}
