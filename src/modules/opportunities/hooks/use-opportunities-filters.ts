import { useNavigate, useSearch } from '@tanstack/react-router'

import { Route } from '@/routes/_authed/app.index'
import { useTableSearch } from '@/shared/table/hooks/use-table-search'
import { toDueOnly } from '@/modules/opportunities/utils/search-input'
import {
  parseHiddenFields,
  serializeHiddenFields,
  toggleHiddenField,
  type HidableField
} from '@/modules/opportunities/utils/display-settings'
import type { StatusTab } from '@/modules/opportunities/utils/rows'
import {
  OPPORTUNITIES_SEARCH_DEFAULTS,
  type OpportunitiesSearch,
  type View
} from '@/modules/opportunities/opportunities-schema'

export function useOpportunitiesFilters() {
  const search = useSearch({ from: Route.id })
  const navigate = useNavigate({ from: Route.fullPath })

  const { sorting, pagination, setSearchFromFirstPage, setSorting, setPagination } =
    useTableSearch<OpportunitiesSearch>({
      search,
      onSearchChange: (patch) => {
        void navigate({ search: (previous) => ({ ...previous, ...patch }), replace: true })
      },
      firstPage: OPPORTUNITIES_SEARCH_DEFAULTS.page
    })

  const isDueOnly = toDueOnly(search)

  // Raw in the URL, normalised for every consumer — see docs/reference/server-side-table.md
  const query = search.q.trim()

  const hiddenFields = parseHiddenFields(search.hidden)

  return {
    tab: search.tab,
    view: search.view,
    hiddenFields,
    search: search.q,
    query,
    isDueOnly,
    hasFilters: query.length > 0 || isDueOnly,
    sorting,
    pagination,
    setTab: (tab: StatusTab) => setSearchFromFirstPage({ tab }),
    setSearch: (q: string) => setSearchFromFirstPage({ q }),
    setDueOnly: (due: boolean) => setSearchFromFirstPage({ due }),

    // Neither is a filter, so neither resets the page: they change how the rows are drawn.
    setView: (view: View) => {
      void navigate({ search: (previous) => ({ ...previous, view }), replace: true })
    },
    toggleField: (field: HidableField) => {
      const hidden = serializeHiddenFields(toggleHiddenField(hiddenFields, field))
      void navigate({ search: (previous) => ({ ...previous, hidden }), replace: true })
    },
    setSorting,
    setPagination,
    resetFilters: () =>
      setSearchFromFirstPage({
        q: OPPORTUNITIES_SEARCH_DEFAULTS.q,
        due: OPPORTUNITIES_SEARCH_DEFAULTS.due
      })
  }
}
