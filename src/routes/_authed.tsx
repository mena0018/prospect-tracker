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
    const user = context.user

    if (!user) {
      throw redirect({ to: APP_ROUTES.login, search: { redirect: location.href } })
    }

    if (user.provisioned) return { user }

    // provisionUser refreshes the token, so the next navigation reads the flipped claim.
    await provisionUser()
    return { user: { ...user, provisioned: true } }
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
