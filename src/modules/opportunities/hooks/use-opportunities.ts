import { queryOptions, useQuery } from '@tanstack/react-query'

import {
  getOpportunitiesSummary,
  listOpportunities
} from '@/modules/opportunities/opportunities-server'
import { useToday } from '@/hooks/use-today'
import type { ListOpportunitiesInput } from '@/modules/opportunities/opportunities-schema'

export const OPPORTUNITIES_QUERY_KEY = ['opportunities']

const opportunitiesQueryOptions = (input: ListOpportunitiesInput) =>
  queryOptions({
    queryKey: [...OPPORTUNITIES_QUERY_KEY, 'page', input],
    queryFn: () => listOpportunities({ data: input }),

    // Keeps the previous page on screen instead of unmounting the table on every paging click.
    placeholderData: (previous) => previous
  })

export function useOpportunities(input: ListOpportunitiesInput) {
  return useQuery(opportunitiesQueryOptions(input))
}

const summaryQueryOptions = (today: string, q: string) =>
  queryOptions({
    queryKey: [...OPPORTUNITIES_QUERY_KEY, 'summary', today, q],
    queryFn: () => getOpportunitiesSummary({ data: { today, q } }),

    // The tab counts follow the search, so keep the last ones while the next arrive.
    placeholderData: (previous) => previous
  })

export function useOpportunitiesSummary(q: string) {
  return useQuery(summaryQueryOptions(useToday(), q))
}
