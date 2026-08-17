import { queryOptions, useQuery } from '@tanstack/react-query'
import { listExperienceLevels } from '@/modules/experience-levels/experience-levels-server'

const EXPERIENCE_LEVELS_QUERY_KEY = ['experience-levels']

export const experienceLevelsQueryOptions = () =>
  queryOptions({
    queryKey: EXPERIENCE_LEVELS_QUERY_KEY,
    queryFn: () => listExperienceLevels()
  })

export function useExperienceLevels() {
  return useQuery(experienceLevelsQueryOptions())
}
