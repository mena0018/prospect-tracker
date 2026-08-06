import { queryOptions, useQuery } from '@tanstack/react-query'

import { OPPORTUNITIES_QUERY_KEY } from '@/modules/opportunities/hooks/use-opportunities'
import { getStageCounts } from '@/modules/opportunities/opportunities-server'
import { TODAY } from '@/modules/opportunities/opportunities-utils'

const stageCountsQueryOptions = () =>
  queryOptions({
    queryKey: [...OPPORTUNITIES_QUERY_KEY, 'stage-counts', TODAY],
    queryFn: () => getStageCounts({ data: { today: TODAY } })
  })

export function useStageCounts() {
  const query = useQuery(stageCountsQueryOptions())

  return {
    stages: query.data?.stages ?? [],
    dueCount: query.data?.dueCount ?? 0,
    ...query
  }
}
