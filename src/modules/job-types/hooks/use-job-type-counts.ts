import { queryOptions, useQuery } from '@tanstack/react-query'

import { getJobTypeCounts } from '@/modules/job-types/job-types-server'

export const JOB_TYPE_COUNTS_QUERY_KEY = ['job-type-counts']

export const jobTypeCountsQueryOptions = () =>
  queryOptions({
    queryKey: JOB_TYPE_COUNTS_QUERY_KEY,
    queryFn: () => getJobTypeCounts()
  })

export function useJobTypeCounts() {
  return useQuery(jobTypeCountsQueryOptions())
}
