import { useMemo } from 'react'

import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import { TODAY, toSortColumn } from '@/modules/opportunities/opportunities-utils'
import type { ListOpportunitiesInput } from '@/modules/opportunities/opportunities-schema'

// Translates the URL view state into the server query input. See docs/reference/server-side-table.md
export function useOpportunitiesListInput(): ListOpportunitiesInput {
  const { tab, search, isDueOnly, sorting, pagination } = useOpportunitiesFilters()

  // Memoised because it is a React Query key: a new object identity per render would refetch.
  return useMemo(
    () => ({
      tab,
      q: search.trim(),
      due: isDueOnly,
      sortBy: sorting[0] ? toSortColumn(sorting[0].id) : null,
      sortDesc: sorting[0]?.desc ?? false,
      page: pagination.pageIndex + 1,
      perPage: pagination.pageSize,
      today: TODAY
    }),
    [tab, search, isDueOnly, sorting, pagination]
  )
}
