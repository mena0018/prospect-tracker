import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

import { APP_ROUTES } from '@/lib/routes'
import { provisionUser } from '@/server/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: APP_ROUTES.login, search: { redirect: location.href } })
    }
    if (!context.user.provisioned) {
      await provisionUser()
    }
  },
  component: AuthedLayout
})

function AuthedLayout() {
  return <Outlet />
}
