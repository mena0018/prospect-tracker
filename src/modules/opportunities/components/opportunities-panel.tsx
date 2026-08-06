import { useCallback, useMemo } from 'react'

import { ErrorState } from '@/components/error-state'
import { m } from '@/i18n/paraglide/messages'
import { KpiBand, KpiBandSkeleton } from '@/modules/opportunities/components/kpi-band'
import {
  OpportunitiesTable,
  OpportunitiesTableSkeleton
} from '@/modules/opportunities/components/opportunities-table'
import {
  OpportunitiesToolbar,
  OpportunitiesToolbarSkeleton
} from '@/modules/opportunities/components/opportunities-toolbar'
import {
  useOpportunities,
  useOpportunitiesSummary
} from '@/modules/opportunities/hooks/use-opportunities'
import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import { useOpportunitiesListInput } from '@/modules/opportunities/hooks/use-opportunities-list-input'
import { useOpportunityMutations } from '@/modules/opportunities/hooks/use-opportunity-mutations'
import { TODAY, toRows, type OpportunityRow } from '@/modules/opportunities/opportunities-utils'
import { indexStages } from '@/modules/stages/stages-utils'
import { useStages } from '@/modules/stages/hooks/use-stages'

const PANEL_LAYOUT = 'flex h-full min-h-0 flex-col'
const PANEL_CARD_LAYOUT =
  'bg-card border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border'

type Props = {
  dailyRateReference: number
}

export function OpportunitiesPanel({ dailyRateReference }: Props) {
  const {
    data: stages,
    isPending: isStagesPending,
    isError: isStagesError,
    refetch: refetchStages
  } = useStages()

  const { search, isDueOnly, pagination, setDueOnly } = useOpportunitiesFilters()
  const hasFilters = search.trim().length > 0 || isDueOnly

  const listInput = useOpportunitiesListInput()

  const {
    data: page,
    isPending: isPagePending,
    isFetching: isPageFetching,
    isError: isPageError,
    refetch: refetchPage
  } = useOpportunities(listInput)

  const {
    data: summary,
    isPending: isSummaryPending,
    isError: isSummaryError,
    refetch: refetchSummary
  } = useOpportunitiesSummary()

  const hasError = isPageError || isStagesError || isSummaryError
  const isPending = isPagePending || isStagesPending || isSummaryPending

  const { update } = useOpportunityMutations()
  const { mutate: updateOpportunity } = update

  const rows = useMemo(() => {
    if (!page || !stages) return []

    return toRows(page.rows, indexStages(stages), TODAY)
  }, [page, stages])

  const togglePin = useCallback(
    (row: OpportunityRow) => updateOpportunity({ id: row.id, isPinned: !row.isPinned }),
    [updateOpportunity]
  )

  const retry = () => {
    void refetchPage()
    void refetchStages()
    void refetchSummary()
  }

  if (hasError) {
    return <ErrorState variant="section" description={m.error_description()} onRetry={retry} />
  }

  if (isPending || !page || !summary) {
    return <OpportunitiesPanelSkeleton rowCount={pagination.pageSize} />
  }

  return (
    <div className={PANEL_LAYOUT}>
      <KpiBand kpis={summary.kpis} />
      <div className={PANEL_CARD_LAYOUT}>
        <OpportunitiesToolbar
          activeCount={summary.activeCount}
          archivedCount={summary.archivedCount}
          onClearDueFilter={() => setDueOnly(false)}
        />
        <OpportunitiesTable
          rows={rows}
          total={page.total}
          servedPage={page.page}
          isFetching={isPageFetching}
          dailyRateReference={dailyRateReference}
          onTogglePin={togglePin}
          emptyTitle={hasFilters ? m.table_noResults() : m.table_empty()}
          emptyHint={hasFilters ? m.table_noResultsHint() : m.table_emptyHint()}
        />
      </div>
    </div>
  )
}

export function OpportunitiesPanelSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <div className={PANEL_LAYOUT}>
      <KpiBandSkeleton />
      <div className={PANEL_CARD_LAYOUT}>
        <OpportunitiesToolbarSkeleton />
        <OpportunitiesTableSkeleton rowCount={rowCount} />
      </div>
    </div>
  )
}
