import { useNavigate, useSearch } from '@tanstack/react-router'

import { APP_ROUTES } from '@/lib/routes'
import { Route } from '@/routes/_authed/app'
import { useTableSearch } from '@/modules/table/hooks/use-table-search'
import type { StatusTab } from '@/modules/opportunities/utils/rows'
import {
  OPPORTUNITIES_SEARCH_DEFAULTS,
  type OpportunitiesSearch
} from '@/modules/opportunities/opportunities-schema'

export function useOpportunitiesFilters() {
  const search = useSearch({ from: Route.id })
  const navigate = useNavigate({ from: APP_ROUTES.dashboard })

  const { sorting, pagination, setSearchFromFirstPage, setSorting, setPagination } =
    useTableSearch<OpportunitiesSearch>({
      search,
      onSearchChange: (patch) => {
        void navigate({ search: (previous) => ({ ...previous, ...patch }), replace: true })
      },
      firstPage: OPPORTUNITIES_SEARCH_DEFAULTS.page
    })

  // The due filter only scopes the active tab; archived rows are never due.
  const isDueOnly = search.due && search.tab === 'active'

  return {
    tab: search.tab,
    search: search.q,
    isDueOnly,
    hasFilters: search.q.trim().length > 0 || isDueOnly,
    sorting,
    pagination,
    setTab: (tab: StatusTab) => setSearchFromFirstPage({ tab }),
    setSearch: (q: string) => setSearchFromFirstPage({ q }),
    setDueOnly: (due: boolean) => setSearchFromFirstPage({ due }),
    setSorting,
    setPagination,
    resetFilters: () =>
      setSearchFromFirstPage({
        q: OPPORTUNITIES_SEARCH_DEFAULTS.q,
        due: OPPORTUNITIES_SEARCH_DEFAULTS.due
      })
  }
}
