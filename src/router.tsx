import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { NotFound } from './components/not-found'
import { deLocalizeUrl, localizeUrl } from './i18n/paraglide/runtime'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
      mutations: { retry: false }
    }
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,

    // Default 1000ms leaves the dashboard blank — see docs/reference/loading-states.md
    defaultPendingMs: 150,
    defaultPreload: 'intent',
    defaultNotFoundComponent: () => <NotFound />,

    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url)
    }
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
