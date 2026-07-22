import { queryOptions, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-key'

import { listOpportunities } from '@/modules/opportunities/opportunities-server'

// Exported so a route loader can prefetch it through the SSR-Query integration.
export const opportunitiesQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.opportunities.all,
    queryFn: () => listOpportunities()
  })

export function useOpportunities() {
  return useQuery(opportunitiesQueryOptions())
}
