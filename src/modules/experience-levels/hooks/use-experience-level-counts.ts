import { queryOptions, useQuery } from '@tanstack/react-query'

import { getExperienceLevelCounts } from '@/modules/experience-levels/experience-levels-server'

export const EXPERIENCE_LEVEL_COUNTS_QUERY_KEY = ['experience-level-counts']

export const experienceLevelCountsQueryOptions = () =>
  queryOptions({
    queryKey: EXPERIENCE_LEVEL_COUNTS_QUERY_KEY,
    queryFn: () => getExperienceLevelCounts()
  })

export function useExperienceLevelCounts() {
  return useQuery(experienceLevelCountsQueryOptions())
}
