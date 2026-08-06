import { useNavigate, useSearch } from '@tanstack/react-router'
import type { PaginationState, SortingState } from '@tanstack/react-table'
import { useCallback, useMemo } from 'react'

import { APP_ROUTES } from '@/lib/routes'
import { Route } from '@/routes/_authed/app'
import {
  parseSort,
  serializeSort,
  type StatusTab
} from '@/modules/opportunities/opportunities-utils'
import {
  OPPORTUNITIES_SEARCH_DEFAULTS,
  type OpportunitiesSearch
} from '@/modules/opportunities/opportunities-schema'

// View state lives in the URL. See docs/reference/server-side-table.md
export function useOpportunitiesFilters() {
  const search = useSearch({ from: Route.id })
  const navigate = useNavigate({ from: APP_ROUTES.dashboard })

  const setFilters = useCallback(
    (patch: Partial<OpportunitiesSearch>) => {
      void navigate({ search: (previous) => ({ ...previous, ...patch }), replace: true })
    },
    [navigate]
  )

  // Narrowing the result set invalidates the current page, so it resets in the same navigation.
  const setFiltersFromFirstPage = useCallback(
    (patch: Partial<OpportunitiesSearch>) =>
      setFilters({ ...patch, page: OPPORTUNITIES_SEARCH_DEFAULTS.page }),
    [setFilters]
  )

  // Both end up in React Query keys: a fresh identity per render would refetch on every one.
  const sorting = useMemo(() => parseSort(search.sort), [search.sort])

  const pagination = useMemo(
    () => ({ pageIndex: search.page - 1, pageSize: search.perPage }),
    [search.page, search.perPage]
  )

  const setPagination = useCallback(
    (next: PaginationState) => setFilters({ page: next.pageIndex + 1, perPage: next.pageSize }),
    [setFilters]
  )

  const setSorting = useCallback(
    (next: SortingState) => setFiltersFromFirstPage({ sort: serializeSort(next) }),
    [setFiltersFromFirstPage]
  )

  const setTab = useCallback(
    (tab: StatusTab) => setFiltersFromFirstPage({ tab }),
    [setFiltersFromFirstPage]
  )

  const setSearch = useCallback(
    (q: string) => setFiltersFromFirstPage({ q }),
    [setFiltersFromFirstPage]
  )

  const setDueOnly = useCallback(
    (due: boolean) => setFiltersFromFirstPage({ due }),
    [setFiltersFromFirstPage]
  )

  // The due filter only scopes the active tab; archived rows are never due.
  const isDueOnly = search.due && search.tab === 'active'

  return {
    tab: search.tab,
    search: search.q,
    isDueOnly,
    sorting,
    pagination,
    setTab,
    setSearch,
    setDueOnly,
    setSorting,
    setPagination
  }
}
