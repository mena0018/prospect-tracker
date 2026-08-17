import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import { useToday } from '@/hooks/use-today'
import { toSortColumn } from '@/modules/opportunities/utils/display'
import type { ListOpportunitiesInput } from '@/modules/opportunities/opportunities-schema'

// See docs/reference/server-side-table.md
export function useOpportunitiesListInput(): ListOpportunitiesInput {
  const { tab, search, isDueOnly, sorting, pagination } = useOpportunitiesFilters()
  const today = useToday()

  return {
    tab,
    q: search.trim(),
    due: isDueOnly,
    sortBy: sorting[0] ? toSortColumn(sorting[0].id) : null,
    sortDesc: sorting[0]?.desc ?? false,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    today
  }
}
