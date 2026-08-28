import { ErrorState } from '@/components/error-state'
import { QueryGate } from '@/components/query-gate'
import { m } from '@/i18n/paraglide/messages'
import { DEFAULT_STAGES } from '@/db/defaults'
import { KpiBand, KpiBandSkeleton } from '@/modules/opportunities/components/kpi-band'
import { OpportunitiesBoard } from '@/modules/opportunities/components/opportunities-board'
import {
  OpportunitiesTable,
  OPPORTUNITIES_COLUMN_COUNT,
  OPPORTUNITIES_GRID_TEMPLATE,
  OPPORTUNITIES_GRID_TRACKS
} from '@/modules/opportunities/components/opportunities-table'
import { BoardSkeleton } from '@/shared/board/components/board-skeleton'
import { DataTableSkeleton } from '@/shared/table/components/data-table-skeleton'
import {
  OpportunitiesToolbar,
  OpportunitiesToolbarSkeleton
} from '@/modules/opportunities/components/opportunities-toolbar'
import {
  useOpportunities,
  useOpportunitiesSummary
} from '@/modules/opportunities/hooks/use-opportunities'
import { useBoard } from '@/modules/opportunities/hooks/use-board'
import { useBoardInput } from '@/modules/opportunities/hooks/use-board-input'
import { useBoardMove } from '@/modules/opportunities/hooks/use-board-move'
import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import { useOpportunitiesInput } from '@/modules/opportunities/hooks/use-opportunities-input'
import { useOpportunityEditorContext } from '@/modules/opportunities/components/opportunity-editor-provider'
import { toRows } from '@/modules/opportunities/utils/rows'
import { indexStages } from '@/modules/stages/stages-utils'
import { useStages } from '@/modules/stages/hooks/use-stages'
import { useToday } from '@/hooks/use-today'
import { useDailyRateReference } from '@/modules/customization/hooks/use-daily-rate-reference'
import type { View } from '@/modules/opportunities/opportunities-schema'
import type { HidableField } from '@/modules/opportunities/utils/display-settings'

const PANEL_LAYOUT = 'flex h-full min-h-0 flex-col'
const PANEL_CARD_LAYOUT =
  'bg-card border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border'

const BOARD_SKELETON_CARDS = 3

export function OpportunitiesPanel() {
  const { hasFilters, pagination, query, isDueOnly, view, hiddenFields } = useOpportunitiesFilters()

  const stagesQuery = useStages()
  const dailyRateQuery = useDailyRateReference()
  const summaryQuery = useOpportunitiesSummary(query, isDueOnly)

  const emptyTitle = hasFilters ? m.table_noResults() : m.table_empty()
  const emptyHint = hasFilters ? m.table_noResultsHint() : m.table_emptyHint()

  if (summaryQuery.isError) {
    return <ErrorState variant="slot" onRetry={() => void summaryQuery.refetch()} />
  }

  return (
    <div className={PANEL_LAYOUT}>
      <QueryGate queries={[summaryQuery]} skeleton={<KpiBandSkeleton />}>
        {([summary]) => <KpiBand kpis={summary.kpis} />}
      </QueryGate>

      <div className={PANEL_CARD_LAYOUT}>
        {view === 'kanban' ? (
          <BoardView
            hiddenFields={hiddenFields}
            summaryQuery={summaryQuery}
            stagesQuery={stagesQuery}
            dailyRateQuery={dailyRateQuery}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
          />
        ) : (
          <ListView
            summaryQuery={summaryQuery}
            stagesQuery={stagesQuery}
            dailyRateQuery={dailyRateQuery}
            pageSize={pagination.pageSize}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
          />
        )}
      </div>
    </div>
  )
}

type ViewProps = {
  summaryQuery: ReturnType<typeof useOpportunitiesSummary>
  stagesQuery: ReturnType<typeof useStages>
  dailyRateQuery: ReturnType<typeof useDailyRateReference>
  emptyTitle: string
  emptyHint: string
}

function ListView({
  summaryQuery,
  stagesQuery,
  dailyRateQuery,
  pageSize,
  emptyTitle,
  emptyHint
}: ViewProps & { pageSize: number }) {
  const input = useOpportunitiesInput()
  const pageQuery = useOpportunities(input)
  const editor = useOpportunityEditorContext()

  return (
    <QueryGate
      queries={[summaryQuery, pageQuery, stagesQuery, dailyRateQuery]}
      skeleton={<PanelSkeleton view="list" rowCount={pageSize} />}
    >
      {([summary, page, stages, dailyRate]) => (
        <>
          <OpportunitiesToolbar
            activeCount={summary.activeCount}
            archivedCount={summary.archivedCount}
          />
          <OpportunitiesTable
            rows={toRows(page.rows, indexStages(stages))}
            total={page.total}
            servedPage={page.page}
            pageCount={page.pageCount}
            isFetching={pageQuery.isFetching}
            onTogglePin={editor.togglePin}
            onEdit={editor.openEdit}
            onToggleArchive={editor.toggleArchive}
            onDelete={editor.requestDelete}
            dailyRateReference={dailyRate.dailyRateReference}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
          />
        </>
      )}
    </QueryGate>
  )
}

function BoardView({
  summaryQuery,
  stagesQuery,
  dailyRateQuery,
  hiddenFields,
  emptyTitle,
  emptyHint
}: ViewProps & { hiddenFields: readonly HidableField[] }) {
  const today = useToday()
  const input = useBoardInput()
  const boardQuery = useBoard(input)
  const move = useBoardMove(input)
  const editor = useOpportunityEditorContext()

  return (
    <QueryGate
      queries={[summaryQuery, boardQuery, stagesQuery, dailyRateQuery]}
      skeleton={<PanelSkeleton view="kanban" rowCount={0} />}
    >
      {([summary, board, stages, dailyRate]) => (
        <>
          <OpportunitiesToolbar
            activeCount={summary.activeCount}
            archivedCount={summary.archivedCount}
          />
          <OpportunitiesBoard
            rows={toRows(board.rows, indexStages(stages))}
            stages={stages}
            today={today}
            hiddenFields={hiddenFields}
            dailyRateReference={dailyRate.dailyRateReference}
            isFetching={boardQuery.isFetching}
            isTruncated={board.isTruncated}
            total={board.total}
            onOpen={editor.openEdit}
            onTogglePin={editor.togglePin}
            onMove={(row, stageId) => move.mutate({ id: row.id, stageId })}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
          />
        </>
      )}
    </QueryGate>
  )
}

function PanelSkeleton({ view, rowCount }: { view: View; rowCount: number }) {
  return (
    <>
      <OpportunitiesToolbarSkeleton />
      {view === 'kanban' ? (
        <BoardSkeleton columnCount={DEFAULT_STAGES.length} cardCount={BOARD_SKELETON_CARDS} />
      ) : (
        <DataTableSkeleton
          gridTemplate={OPPORTUNITIES_GRID_TEMPLATE}
          gridTracks={OPPORTUNITIES_GRID_TRACKS}
          rowCount={rowCount}
          columnCount={OPPORTUNITIES_COLUMN_COUNT}
          hasSilentColumn
        />
      )}
    </>
  )
}

export function OpportunitiesPanelSkeleton({ view, rowCount }: { view: View; rowCount: number }) {
  return (
    <div className={PANEL_LAYOUT}>
      <KpiBandSkeleton />
      <div className={PANEL_CARD_LAYOUT}>
        <PanelSkeleton view={view} rowCount={rowCount} />
      </div>
    </div>
  )
}
