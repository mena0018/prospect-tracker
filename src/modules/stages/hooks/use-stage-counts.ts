import { queryOptions, useQuery } from '@tanstack/react-query'

import { OPPORTUNITIES_QUERY_KEY } from '@/modules/opportunities/hooks/use-opportunities'
import { getStageCounts } from '@/modules/stages/stages-server'
import { useToday } from '@/hooks/use-today'

const stageCountsQueryOptions = (today: string) =>
  queryOptions({
    queryKey: [...OPPORTUNITIES_QUERY_KEY, 'stage-counts', today],
    queryFn: () => getStageCounts({ data: { today } })
  })

export function useStageCounts() {
  const query = useQuery(stageCountsQueryOptions(useToday()))

  return {
    stages: query.data?.stages ?? [],
    dueCount: query.data?.dueCount ?? 0,
    ...query
  }
}
