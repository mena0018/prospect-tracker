import { queryOptions, useQuery } from '@tanstack/react-query'

import { getDailyRateReference } from '@/modules/customization/customization-server'

export const DAILY_RATE_REFERENCE_QUERY_KEY = ['daily-rate-reference']

export const dailyRateReferenceQueryOptions = () =>
  queryOptions({
    queryKey: DAILY_RATE_REFERENCE_QUERY_KEY,
    queryFn: () => getDailyRateReference()
  })

export function useDailyRateReference() {
  return useQuery(dailyRateReferenceQueryOptions())
}
