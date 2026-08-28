import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import { OpportunityCard } from '@/modules/opportunities/components/opportunity-card'
import { BOARD_ID, toColumns, type BoardColumn } from '@/modules/opportunities/utils/board'
import { StageDot } from '@/modules/stages/components/stage-dot'
import { stageColorVar } from '@/modules/stages/stages-utils'
import { BoardDropZone } from '@/shared/board/components/board-drop-zone'
import {
  BOARD_LAYOUT,
  COLUMN_HEADER_LAYOUT,
  COLUMN_LAYOUT,
  COLUMN_SCROLLER_LAYOUT
} from '@/shared/board/components/board-layout'
import { LiveRegion } from '@/shared/sortable/components/live-region'
import { useBoardColumn, useBoardDnd } from '@/shared/board/hooks/use-board-dnd'
import { useMoveAnnouncer } from '@/shared/board/hooks/use-move-announcer'
import type { Stage } from '@/db/schema'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

type Props = {
  rows: OpportunityRow[]
  stages: Stage[]
  today: string
  dailyRateReference: number
  isFetching: boolean
  isTruncated: boolean
  total: number
  onOpen: (row: OpportunityRow) => void
  onTogglePin: (row: OpportunityRow) => void
  onMove: (row: OpportunityRow, stageId: string) => void
  emptyTitle: string
  emptyHint: string
}

export function OpportunitiesBoard({
  rows,
  stages,
  today,
  dailyRateReference,
  isFetching,
  isTruncated,
  total,
  onOpen,
  onTogglePin,
  onMove,
  emptyTitle,
  emptyHint
}: Props) {
  const columns = toColumns(rows, stages)
  const byId = new Map(rows.map((row) => [row.id, row]))

  const move = (cardId: string, toColumnId: string) => {
    const row = byId.get(cardId)
    if (row) onMove(row, toColumnId)
  }

  const { message, commitMove } = useMoveAnnouncer(
    rows.map((row) => ({ id: row.id, name: row.recruiter })),
    columns.map((column) => ({ id: column.stage.id, name: column.stage.name })),
    move
  )

  useBoardDnd({ boardId: BOARD_ID, onMove: commitMove })

  if (columns.length === 0) {
    return <BoardNotice title={m.board_noStages()} hint={m.board_noStagesHint()} />
  }

  if (rows.length === 0) {
    return <BoardNotice title={emptyTitle} hint={emptyHint} />
  }

  return (
    <>
      <LiveRegion message={message} />
      {isTruncated && (
        <p className="text-muted-foreground border-border-soft flex-none border-b px-4.5 py-2 text-xs">
          {m.board_truncated({ shown: rows.length, total })}
        </p>
      )}
      <div
        aria-busy={isFetching}
        className={cn(BOARD_LAYOUT, isFetching && 'pointer-events-none opacity-50')}
      >
        {columns.map((column) => (
          <BoardColumnView
            key={column.stage.id}
            column={column}
            stages={stages}
            today={today}
            dailyRateReference={dailyRateReference}
            onOpen={onOpen}
            onTogglePin={onTogglePin}
            onMove={commitMove}
          />
        ))}
      </div>
    </>
  )
}

type ColumnProps = {
  column: BoardColumn
  stages: Stage[]
  today: string
  dailyRateReference: number
  onOpen: (row: OpportunityRow) => void
  onTogglePin: (row: OpportunityRow) => void
  onMove: (cardId: string, stageId: string) => void
}

function BoardColumnView({
  column,
  stages,
  today,
  dailyRateReference,
  onOpen,
  onTogglePin,
  onMove
}: ColumnProps) {
  const { stage, cards } = column
  const { ref, isOver } = useBoardColumn(BOARD_ID, stage.id)
  const headingId = `board-column-${stage.id}`

  return (
    <section
      ref={ref}
      aria-labelledby={headingId}
      style={{ '--stage-dot': stageColorVar(stage.color) } as React.CSSProperties}
      className={cn(COLUMN_LAYOUT, isOver && 'border-(--stage-dot) bg-(--stage-dot)/5')}
    >
      <h2 id={headingId} className={COLUMN_HEADER_LAYOUT}>
        <StageDot size="md" />
        <span className="min-w-0 flex-1 truncate">{stage.name}</span>
        <span className="text-muted-foreground bg-secondary rounded-full px-1.75 text-xs font-semibold tabular-nums">
          {cards.length}
        </span>
        <span className="sr-only">{m.board_columnCount({ count: cards.length })}</span>
      </h2>

      <div className={COLUMN_SCROLLER_LAYOUT}>
        {cards.length === 0 ? (
          <BoardDropZone label={m.board_emptyColumn()} isOver={isOver} />
        ) : (
          cards.map((row) => (
            <OpportunityCard
              key={row.id}
              row={row}
              stages={stages}
              today={today}
              dailyRateReference={dailyRateReference}
              onOpen={() => onOpen(row)}
              onTogglePin={() => onTogglePin(row)}
              onMove={(stageId) => onMove(row.id, stageId)}
            />
          ))
        )}
      </div>
    </section>
  )
}

function BoardNotice({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-4 py-14 text-center">
      <span className="font-semibold">{title}</span>
      <span className="text-muted-foreground text-xs">{hint}</span>
    </div>
  )
}
