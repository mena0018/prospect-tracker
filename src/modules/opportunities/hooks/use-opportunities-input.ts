import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import { useToday } from '@/hooks/use-today'
import { toSortColumn } from '@/modules/opportunities/utils/display'
import type { GetOpportunitiesInput } from '@/modules/opportunities/opportunities-schema'

// See docs/reference/server-side-table.md
export function useOpportunitiesInput(): GetOpportunitiesInput {
  const today = useToday()
  const { tab, query, isDueOnly, sorting, pagination } = useOpportunitiesFilters()

  return {
    tab,
    q: query,
    due: isDueOnly,
    sortBy: sorting[0] ? toSortColumn(sorting[0].id) : null,
    sortDesc: sorting[0]?.desc ?? false,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    today
  }
}
