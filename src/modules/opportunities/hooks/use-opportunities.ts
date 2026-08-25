import { queryOptions, useQuery } from '@tanstack/react-query'

import {
  getOpportunitiesSummary,
  getOpportunities
} from '@/modules/opportunities/opportunities-server'
import { useToday } from '@/hooks/use-today'
import type { GetOpportunitiesInput } from '@/modules/opportunities/opportunities-schema'

export const OPPORTUNITIES_QUERY_KEY = ['opportunities']

export const opportunitiesQueryOptions = (input: GetOpportunitiesInput) =>
  queryOptions({
    queryKey: [...OPPORTUNITIES_QUERY_KEY, 'page', input],
    queryFn: () => getOpportunities({ data: input }),

    // Keeps the previous page on screen instead of unmounting the table on every paging click.
    placeholderData: (previous) => previous
  })

export function useOpportunities(input: GetOpportunitiesInput) {
  return useQuery(opportunitiesQueryOptions(input))
}

export const summaryQueryOptions = (today: string, q: string, due: boolean) =>
  queryOptions({
    queryKey: [...OPPORTUNITIES_QUERY_KEY, 'summary', today, q, due],
    queryFn: () => getOpportunitiesSummary({ data: { today, q, due } }),

    placeholderData: (previous) => previous
  })

// Omitting the filters gives tab counts over the whole pipeline — see docs/reference/kpis.md
export function useOpportunitiesSummary(q = '', due = false) {
  return useQuery(summaryQueryOptions(useToday(), q, due))
}
