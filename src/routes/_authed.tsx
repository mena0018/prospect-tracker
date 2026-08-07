import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

import { AppShell } from '@/components/layout/app-shell'
import { APP_ROUTES } from '@/lib/routes'
import { provisionUser } from '@/modules/auth/auth-server'

const getSidebarState = createServerFn().handler(() => ({
  sidebarOpen: getCookie('sidebar_state') !== 'false'
}))

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: APP_ROUTES.login, search: { redirect: location.href } })
    }
    if (!context.user.provisioned) {
      await provisionUser()
    }
    return { user: context.user }
  },
  loader: () => getSidebarState(),
  component: AuthedLayout
})

function AuthedLayout() {
  const { sidebarOpen } = Route.useLoaderData()

  return (
    <AppShell defaultSidebarOpen={sidebarOpen}>
      <Outlet />
    </AppShell>
  )
}
