import { queryOptions, useQuery } from '@tanstack/react-query'
import { getStages } from '@/modules/stages/stages-server'

export const STAGES_QUERY_KEY = ['stages']

export const stagesQueryOptions = () =>
  queryOptions({
    queryKey: STAGES_QUERY_KEY,
    queryFn: () => getStages()
  })

export function useStages() {
  return useQuery(stagesQueryOptions())
}
