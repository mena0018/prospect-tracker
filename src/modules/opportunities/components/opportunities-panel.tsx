import { useMemo } from 'react'

import { ErrorState } from '@/components/error-state'
import { m } from '@/i18n/paraglide/messages'
import { KpiBand, KpiBandSkeleton } from '@/modules/opportunities/components/kpi-band'
import {
  OpportunitiesTable,
  OPPORTUNITIES_COLUMN_COUNT,
  OPPORTUNITIES_GRID_TEMPLATE
} from '@/modules/opportunities/components/opportunities-table'
import { DataTableSkeleton } from '@/shared/table/components/data-table-skeleton'
import {
  OpportunitiesToolbar,
  OpportunitiesToolbarSkeleton
} from '@/modules/opportunities/components/opportunities-toolbar'
import {
  useOpportunities,
  useOpportunitiesSummary
} from '@/modules/opportunities/hooks/use-opportunities'
import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import { useOpportunitiesInput } from '@/modules/opportunities/hooks/use-opportunities-input'
import { useOpportunityEditorContext } from '@/modules/opportunities/components/opportunity-editor-provider'
import { toRows } from '@/modules/opportunities/utils/rows'
import { indexStages } from '@/modules/stages/stages-utils'
import { useStages } from '@/modules/stages/hooks/use-stages'
import { useCustomization } from '@/modules/customization/use-customization'

const PANEL_LAYOUT = 'flex h-full min-h-0 flex-col'
const PANEL_CARD_LAYOUT =
  'bg-card border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border'

export function OpportunitiesPanel() {
  const input = useOpportunitiesInput()
  const { hasFilters, pagination, query, isDueOnly } = useOpportunitiesFilters()

  const {
    data: customization,
    isPending: isCustomizationPending,
    isError: isCustomizationError,
    refetch: refetchCustomization
  } = useCustomization()

  const {
    data: stages,
    isPending: isStagesPending,
    isError: isStagesError,
    refetch: refetchStages
  } = useStages()

  const {
    data: page,
    isPending: isPagePending,
    isFetching: isPageFetching,
    isError: isPageError,
    refetch: refetchPage
  } = useOpportunities(input)

  const {
    data: summary,
    isPending: isSummaryPending,
    isError: isSummaryError,
    refetch: refetchSummary
  } = useOpportunitiesSummary(query, isDueOnly)

  const hasError = isPageError || isStagesError || isSummaryError || isCustomizationError
  const isPending = isPagePending || isStagesPending || isSummaryPending || isCustomizationPending

  const editor = useOpportunityEditorContext()

  const rows = useMemo(() => {
    if (!page || !stages) return []

    return toRows(page.rows, indexStages(stages))
  }, [page, stages])

  const retry = () => {
    void refetchPage()
    void refetchStages()
    void refetchSummary()
    void refetchCustomization()
  }

  if (hasError) {
    return <ErrorState variant="section" description={m.error_description()} onRetry={retry} />
  }

  if (isPending) {
    return <OpportunitiesPanelSkeleton rowCount={pagination.pageSize} />
  }

  return (
    <div className={PANEL_LAYOUT}>
      <KpiBand kpis={summary.kpis} />
      <div className={PANEL_CARD_LAYOUT}>
        <OpportunitiesToolbar
          activeCount={summary.activeCount}
          archivedCount={summary.archivedCount}
        />
        <OpportunitiesTable
          rows={rows}
          total={page.total}
          servedPage={page.page}
          pageCount={page.pageCount}
          isFetching={isPageFetching}
          onTogglePin={editor.togglePin}
          onEdit={editor.openEdit}
          onToggleArchive={editor.toggleArchive}
          onDelete={editor.requestDelete}
          dailyRateReference={customization.dailyRateReference}
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
        <DataTableSkeleton
          gridTemplate={OPPORTUNITIES_GRID_TEMPLATE}
          rowCount={rowCount}
          columnCount={OPPORTUNITIES_COLUMN_COUNT}
          hasSilentColumn
        />
      </div>
    </div>
  )
}
