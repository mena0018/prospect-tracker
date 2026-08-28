import { Bell, MoreHorizontal } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import { PinButton } from '@/modules/opportunities/components/pin-button'
import {
  formatDailyRate,
  formatRelativeDate,
  isAboveReference
} from '@/modules/opportunities/utils/display'
import { BOARD_ID } from '@/modules/opportunities/utils/board'
import { CARD_LAYOUT } from '@/shared/board/components/board-layout'
import { useBoardCard } from '@/shared/board/hooks/use-board-dnd'
import type { Stage } from '@/db/schema'
import type { HidableField } from '@/modules/opportunities/utils/display-settings'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

type Props = {
  row: OpportunityRow
  stages: Stage[]
  today: string
  hiddenFields: readonly HidableField[]
  dailyRateReference: number
  onOpen: () => void
  onTogglePin: () => void
  onMove: (stageId: string) => void
}

export function OpportunityCard({
  row,
  stages,
  today,
  hiddenFields,
  dailyRateReference,
  onOpen,
  onTogglePin,
  onMove
}: Props) {
  const { ref, isDragging } = useBoardCard(BOARD_ID, row.id, row.stageId, row.recruiter)

  const shows = (field: HidableField) => !hiddenFields.includes(field)

  const showsEsn = row.esn !== null && shows('esn')
  const showsEndClient = row.endClient !== null && shows('endClient')
  const showsDate = shows('lastContactAt')
  const showsRate = shows('dailyRate')

  // Everything the card can be moved to — its own column is not a destination.
  const destinations = stages.filter((stage) => !stage.isArchived && stage.id !== row.stageId)

  return (
    <div
      ref={ref}
      // The card is its own click target and its own drag source: a stretched overlay button would
      // cover the surface `canDrag` hit-tests, and no drag could ever start.
      role="button"
      tabIndex={0}
      aria-label={m.board_openCard({ recruiter: row.recruiter })}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        // Space scrolls the column otherwise.
        event.preventDefault()
        onOpen()
      }}
      className={cn(
        CARD_LAYOUT,
        // The whole card is the drag source, so it must look liftable: the grab cursor names the
        // gesture, the rise and shadow preview it. See docs/reference/board-mechanism.md
        'cursor-grab transition-[box-shadow,transform,border-color,background-color] duration-150',
        'hover:border-ring/40 hover:-translate-y-px hover:shadow-md',
        'active:translate-y-0 active:cursor-grabbing active:shadow-sm',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        row.isPinned && 'bg-accent/35',
        isDragging && 'opacity-40'
      )}
    >
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          {/* The need leads when there is one; without it the recruiter is the card's identity,
              and a bare dash above a name would be the only title. */}
          <span className="block truncate font-semibold">{row.need ?? row.recruiter}</span>
          {row.need !== null && (
            <span className="text-muted-foreground block truncate text-xs">{row.recruiter}</span>
          )}
        </div>

        <div className="flex flex-none items-center">
          <PinButton isPinned={row.isPinned} onToggle={onTogglePin} />
          {destinations.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={m.table_rowActions()}
                    className="text-muted-foreground hover:text-foreground"
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              {/* Dragging is an addition, never a replacement — see docs/reference/board-mechanism.md */}
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{m.board_moveGroupLabel()}</DropdownMenuLabel>
                  {destinations.map((stage) => (
                    <DropdownMenuItem key={stage.id} onClick={() => onMove(stage.id)}>
                      {stage.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Rendered only when filled: a card is short, and two dashes cost the same height as two
          real lines. */}
      {(showsEsn || showsEndClient) && (
        <div className="text-muted-foreground flex min-w-0 flex-col gap-0.5 text-xs">
          {showsEsn && <span className="truncate">{row.esn}</span>}
          {showsEndClient && <span className="truncate">{row.endClient}</span>}
        </div>
      )}

      {(showsDate || showsRate) && (
        <div className="flex items-center justify-between gap-2">
          {showsDate ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold',
                row.isDue ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {row.isDue && <Bell className="size-3" />}
              {formatRelativeDate(row.lastContactAt, today)}
            </span>
          ) : (
            <span />
          )}
          {showsRate && (
            <span
              className={cn(
                'text-xs font-semibold tabular-nums',
                row.dailyRate === null
                  ? 'text-muted-foreground'
                  : isAboveReference(row.dailyRate, dailyRateReference)
                    ? 'text-rate-above'
                    : 'text-rate-below'
              )}
            >
              {formatDailyRate(row.dailyRate)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
