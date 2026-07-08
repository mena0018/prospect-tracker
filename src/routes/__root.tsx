import type { ReactNode } from 'react'

import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'

import { fetchUser, type AuthUser } from '@/server/auth'
import appCss from '@/styles.css?url'

export const Route = createRootRoute({
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
  component: RootComponent
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
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
