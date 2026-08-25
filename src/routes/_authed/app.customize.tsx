import { createFileRoute, useRouter } from '@tanstack/react-router'

import { ErrorState } from '@/components/error-state'
import { m } from '@/i18n/paraglide/messages'
import {
  CustomizationPanel,
  CustomizationPanelSkeleton
} from '@/modules/customization/components/customization-panel'
import { experienceLevelCountsQueryOptions } from '@/modules/experience-levels/hooks/use-experience-level-counts'
import { jobTypeCountsQueryOptions } from '@/modules/job-types/hooks/use-job-type-counts'
import { dailyRateReferenceQueryOptions } from '@/modules/customization/hooks/use-daily-rate-reference'
import { experienceLevelsQueryOptions } from '@/modules/experience-levels/hooks/use-experience-levels'
import { jobTypesQueryOptions } from '@/modules/job-types/hooks/use-job-types'
import { stagesQueryOptions } from '@/modules/stages/hooks/use-stages'
import { stageCountsQueryOptions } from '@/modules/stages/hooks/use-stage-counts'
import { getToday } from '@/hooks/use-today'

export const Route = createFileRoute('/_authed/app/customize')({
  ssr: 'data-only',

  // Nothing is awaited, on the server either: pending queries are streamed to the client by
  // setupRouterSsrQueryIntegration — see docs/reference/query-prefetching.md
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(jobTypesQueryOptions())
    queryClient.prefetchQuery(jobTypeCountsQueryOptions())
    queryClient.prefetchQuery(experienceLevelsQueryOptions())
    queryClient.prefetchQuery(experienceLevelCountsQueryOptions())
    queryClient.prefetchQuery(stagesQueryOptions())
    queryClient.prefetchQuery(dailyRateReferenceQueryOptions())
    queryClient.prefetchQuery(stageCountsQueryOptions(getToday()))
  },

  component: Customize,
  pendingComponent: CustomizationPanelSkeleton,
  errorComponent: CustomizeError
})

function Customize() {
  return <CustomizationPanel />
}

function CustomizeError() {
  const router = useRouter()

  return (
    <ErrorState description={m.error_dashboardDescription()} onRetry={() => router.invalidate()} />
  )
}
