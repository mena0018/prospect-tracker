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
  const stages = query.data?.stages ?? []

  return {
    stages,
    hasPipeline: stages.some((stage) => stage.count > 0),
    // Undefined until loaded, so the ticker animates from the real value instead of from a
    // placeholder zero — see docs/reference/number-ticker.md
    dueCount: query.data?.dueCount,
    doneToday: query.data?.doneToday,
    ...query
  }
}
