import { createFileRoute, stripSearchParams, useRouter } from '@tanstack/react-router'

import { ErrorState } from '@/components/error-state'
import { m } from '@/i18n/paraglide/messages'
import { getCustomization } from '@/modules/customization/customization-server'
import {
  OPPORTUNITIES_SEARCH_DEFAULTS,
  opportunitiesSearchSchema
} from '@/modules/opportunities/opportunities-schema'
import {
  OpportunitiesPanel,
  OpportunitiesPanelSkeleton
} from '@/modules/opportunities/components/opportunities-panel'
import { stagesQueryOptions } from '@/modules/stages/hooks/use-stages'

export const Route = createFileRoute('/_authed/app')({
  ssr: 'data-only',
  validateSearch: opportunitiesSearchSchema,
  search: { middlewares: [stripSearchParams(OPPORTUNITIES_SEARCH_DEFAULTS)] },

  loader: async ({ context: { queryClient } }) => {
    const [{ dailyRateReference }] = await Promise.all([
      getCustomization(),
      queryClient.ensureQueryData(stagesQueryOptions())
    ])

    return { dailyRateReference }
  },
  component: Dashboard,
  pendingComponent: DashboardPending,
  errorComponent: DashboardError
})

function DashboardPending() {
  const { perPage } = Route.useSearch()

  return <OpportunitiesPanelSkeleton rowCount={perPage} />
}

function Dashboard() {
  const { dailyRateReference } = Route.useLoaderData()

  return <OpportunitiesPanel dailyRateReference={dailyRateReference} />
}

function DashboardError() {
  const router = useRouter()

  return (
    <ErrorState description={m.error_dashboardDescription()} onRetry={() => router.invalidate()} />
  )
}
