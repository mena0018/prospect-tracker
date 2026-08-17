import { queryOptions, useQuery } from '@tanstack/react-query'
import { listJobTypes } from '@/modules/job-types/job-types-server'

const JOB_TYPES_QUERY_KEY = ['job-types']

export const jobTypesQueryOptions = () =>
  queryOptions({
    queryKey: JOB_TYPES_QUERY_KEY,
    queryFn: () => listJobTypes()
  })

export function useJobTypes() {
  return useQuery(jobTypesQueryOptions())
}
