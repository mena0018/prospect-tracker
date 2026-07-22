import { queryOptions, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-key'

import { listOpportunities } from '@/modules/opportunities/opportunities-server'

const opportunitiesQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.opportunities.all,
    queryFn: () => listOpportunities()
  })

export function useOpportunities() {
  return useQuery(opportunitiesQueryOptions())
}
