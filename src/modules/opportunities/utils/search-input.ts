import { toSortColumn } from '@/modules/opportunities/utils/display'
import { parseSort, toPaginationState } from '@/shared/table/table-utils'
import type {
  GetBoardInput,
  GetOpportunitiesInput,
  OpportunitiesSearch
} from '@/modules/opportunities/opportunities-schema'

// The due filter only scopes the active tab; archived rows are never due.
export function toDueOnly(search: OpportunitiesSearch) {
  return search.due && search.tab === 'active'
}

// Pure so the route context can build the very same query keys the components use — a loader
// that derives them differently prefetches under a key nobody reads.
// See docs/reference/query-prefetching.md
export function toOpportunitiesInput(
  search: OpportunitiesSearch,
  today: string
): GetOpportunitiesInput {
  const sorting = parseSort(search.sort)
  const pagination = toPaginationState(search.page, search.perPage)

  return {
    tab: search.tab,
    q: search.q.trim(),
    due: toDueOnly(search),
    sortBy: sorting[0] ? toSortColumn(sorting[0].id) : null,
    sortDesc: sorting[0]?.desc ?? false,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    today
  }
}

// Same filters as the table, minus the sort and the page the board has no use for.
export function toBoardInput(search: OpportunitiesSearch, today: string): GetBoardInput {
  return {
    tab: search.tab,
    q: search.q.trim(),
    due: toDueOnly(search),
    today
  }
}
