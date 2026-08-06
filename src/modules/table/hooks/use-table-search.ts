import type { PaginationState, SortingState } from '@tanstack/react-table'

import {
  fromPaginationState,
  parseSort,
  serializeSort,
  toPaginationState
} from '@/modules/table/table-utils'
import type { TableSearch } from '@/modules/table/table-schema'

type Options<TSearch extends TableSearch> = {
  search: TSearch
  firstPage: number
  onSearchChange: (patch: Partial<TSearch> | Partial<TableSearch>) => void
}

export function useTableSearch<TSearch extends TableSearch>({
  search,
  onSearchChange,
  firstPage
}: Options<TSearch>) {
  // Narrowing the result set invalidates the current page, so it resets in the same navigation.
  const setSearchFromFirstPage = (patch: Partial<TSearch> | Partial<TableSearch>) =>
    onSearchChange({ ...patch, page: firstPage })

  return {
    sorting: parseSort(search.sort),
    pagination: toPaginationState(search.page, search.perPage),
    setSearchFromFirstPage,
    setSorting: (next: SortingState) => setSearchFromFirstPage({ sort: serializeSort(next) }),
    setPagination: (next: PaginationState) => onSearchChange(fromPaginationState(next))
  }
}
