import type { ReactNode } from 'react'

import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouter
} from '@tanstack/react-router'

import { ErrorState } from '@/components/error-state'
import { fetchUser, type AuthUser } from '@/server/auth'
import appCss from '@/styles.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async (): Promise<{ user: AuthUser | null }> => {
    const user = await fetchUser()
    return { user }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ProspectTracker' }
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
    ]
  }),
  component: RootComponent,
  errorComponent: RootErrorComponent
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootErrorComponent() {
  const router = useRouter()
  return (
    <RootDocument>
      <ErrorState onRetry={() => router.invalidate()} />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
