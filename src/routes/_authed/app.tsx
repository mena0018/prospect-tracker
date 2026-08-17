import { createFileRoute, stripSearchParams, useRouter } from '@tanstack/react-router'

import { ErrorState } from '@/components/error-state'
import { m } from '@/i18n/paraglide/messages'
import {
  OPPORTUNITIES_SEARCH_DEFAULTS,
  opportunitiesSearchSchema
} from '@/modules/opportunities/opportunities-schema'
import {
  OpportunitiesPanel,
  OpportunitiesPanelSkeleton
} from '@/modules/opportunities/components/opportunities-panel'
import { stagesQueryOptions } from '@/modules/stages/hooks/use-stages'
import { customizationQueryOptions } from '@/modules/customization/use-customization'
import { jobTypesQueryOptions } from '@/modules/job-types/use-job-types'
import { experienceLevelsQueryOptions } from '@/modules/experience-levels/use-experience-levels'

export const Route = createFileRoute('/_authed/app')({
  ssr: 'data-only',
  validateSearch: opportunitiesSearchSchema,
  search: { middlewares: [stripSearchParams(OPPORTUNITIES_SEARCH_DEFAULTS)] },

  loader: async ({ context: { queryClient } }) => {
    // Only the table data below blocks the page; these load in the background.
    queryClient.prefetchQuery(jobTypesQueryOptions())
    queryClient.prefetchQuery(experienceLevelsQueryOptions())

    await Promise.all([
      queryClient.ensureQueryData(stagesQueryOptions()),
      queryClient.ensureQueryData(customizationQueryOptions())
    ])
  },

  component: Dashboard,
  pendingComponent: DashboardPending,
  errorComponent: DashboardError
})

function Dashboard() {
  return <OpportunitiesPanel />
}

function DashboardPending() {
  const { perPage } = Route.useSearch()

  return <OpportunitiesPanelSkeleton rowCount={perPage} />
}

function DashboardError() {
  const router = useRouter()

  return (
    <ErrorState description={m.error_dashboardDescription()} onRetry={() => router.invalidate()} />
  )
}
