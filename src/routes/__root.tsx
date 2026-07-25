import type { ReactNode } from 'react'

import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  redirect,
  Scripts,
  useRouter
} from '@tanstack/react-router'

import { ErrorState } from '@/components/error-state'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme'
import { fetchUser, type AuthUser } from '@/modules/auth/auth-server'
import { getLocale, shouldRedirect } from '@/i18n/paraglide/runtime'
import { CONFIG } from '@/lib/config'
import appCss from '@/styles/globals.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async (): Promise<{ user: AuthUser | null }> => {
    if (typeof window !== 'undefined') {
      const decision = await shouldRedirect({ url: window.location.href })
      if (decision.redirectUrl) {
        throw redirect({ href: decision.redirectUrl.href })
      }
    }

    const user = await fetchUser()
    return { user }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: CONFIG.brand }
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
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider defaultTheme={DEFAULT_THEME} storageKey={THEME_STORAGE_KEY}>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
