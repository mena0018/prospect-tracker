import { queryOptions, useQuery } from '@tanstack/react-query'
import { listStages } from '@/modules/stages/stages-server'

const STAGES_QUERY_KEY = ['stages']

export const stagesQueryOptions = () =>
  queryOptions({
    queryKey: STAGES_QUERY_KEY,
    queryFn: () => listStages()
  })

export function useStages() {
  return useQuery(stagesQueryOptions())
}
