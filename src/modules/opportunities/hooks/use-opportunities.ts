import { queryOptions, useQuery } from '@tanstack/react-query'

import {
  getOpportunitiesSummary,
  listOpportunities
} from '@/modules/opportunities/opportunities-server'
import { TODAY } from '@/modules/opportunities/opportunities-utils'
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

const summaryQueryOptions = () =>
  queryOptions({
    queryKey: [...OPPORTUNITIES_QUERY_KEY, 'summary', TODAY],
    queryFn: () => getOpportunitiesSummary({ data: { today: TODAY } })
  })

export function useOpportunitiesSummary() {
  return useQuery(summaryQueryOptions())
}
