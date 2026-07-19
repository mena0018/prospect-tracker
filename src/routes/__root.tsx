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
import { ThemeProvider } from '@/components/theme/theme-provider'
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme'
import { fetchUser, type AuthUser } from '@/server/auth'
import appCss from '@/styles/globals.css?url'

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
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme={DEFAULT_THEME} storageKey={THEME_STORAGE_KEY}>
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
