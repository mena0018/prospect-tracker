import { queryOptions, useQuery } from '@tanstack/react-query'

import { DEFAULT_STAGES } from '@/db/defaults'

import { OPPORTUNITIES_QUERY_KEY } from '@/modules/opportunities/hooks/use-opportunities'
import { getStageCounts } from '@/modules/stages/stages-server'
import { useToday } from '@/hooks/use-today'

// Under the opportunities key so an opportunity write refreshes the counts through the parent.
export const STAGE_COUNTS_QUERY_KEY = [...OPPORTUNITIES_QUERY_KEY, 'stage-counts']

export const stageCountsQueryOptions = (today: string) =>
  queryOptions({
    queryKey: [...STAGE_COUNTS_QUERY_KEY, today],
    queryFn: () => getStageCounts({ data: { today } })
  })

export function useStageCounts() {
  const query = useQuery(stageCountsQueryOptions(useToday()))
  const stages = query.data?.stages ?? []

  return {
    stages,

    // The sidebar shows the working pipeline; archived stages sit outside the active kanban.
    activeStages: stages.filter((stage) => !stage.isArchived),
    skeletonCount: DEFAULT_STAGES.length,
    hasPipeline: stages.some((stage) => stage.count > 0),

    // Undefined until loaded, so the ticker animates from the real value instead of from a
    // placeholder zero — see docs/reference/number-ticker.md
    dueCount: query.data?.dueCount,
    doneToday: query.data?.doneToday,
    ...query
  }
}
