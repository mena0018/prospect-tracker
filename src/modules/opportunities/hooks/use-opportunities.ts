import { queryOptions, useQuery } from '@tanstack/react-query'

import {
  getOpportunitiesSummary,
  getOpportunities
} from '@/modules/opportunities/opportunities-server'
import { useToday } from '@/hooks/use-today'
import type { GetOpportunitiesInput } from '@/modules/opportunities/opportunities-schema'

export const OPPORTUNITIES_QUERY_KEY = ['opportunities']

const opportunitiesQueryOptions = (input: GetOpportunitiesInput) =>
  queryOptions({
    queryKey: [...OPPORTUNITIES_QUERY_KEY, 'page', input],
    queryFn: () => getOpportunities({ data: input }),

    // Keeps the previous page on screen instead of unmounting the table on every paging click.
    placeholderData: (previous) => previous
  })

export function useOpportunities(input: GetOpportunitiesInput) {
  return useQuery(opportunitiesQueryOptions(input))
}

const summaryQueryOptions = (today: string, q: string) =>
  queryOptions({
    queryKey: [...OPPORTUNITIES_QUERY_KEY, 'summary', today, q],
    queryFn: () => getOpportunitiesSummary({ data: { today, q } }),

    placeholderData: (previous) => previous
  })

// Omitting `q` gives tab counts over the whole pipeline — see docs/reference/kpis.md
export function useOpportunitiesSummary(q = '') {
  return useQuery(summaryQueryOptions(useToday(), q))
}
