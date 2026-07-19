import { createFileRoute, redirect } from '@tanstack/react-router'

import { APP_ROUTES } from '@/lib/routes'

// Public landing page not built yet (DEV-24) — send visitors straight to auth.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: APP_ROUTES.login })
  }
})
