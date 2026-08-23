import { queryOptions, useQuery } from '@tanstack/react-query'
import { getJobTypes } from '@/modules/job-types/job-types-server'

export const JOB_TYPES_QUERY_KEY = ['job-types']

export const jobTypesQueryOptions = () =>
  queryOptions({
    queryKey: JOB_TYPES_QUERY_KEY,
    queryFn: () => getJobTypes()
  })

export function useJobTypes() {
  return useQuery(jobTypesQueryOptions())
}
