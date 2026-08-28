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
import { DragHandle } from '@/shared/sortable/components/sortable-row'
import { useBoardCard } from '@/shared/board/hooks/use-board-dnd'
import type { Stage } from '@/db/schema'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

type Props = {
  row: OpportunityRow
  stages: Stage[]
  today: string
  dailyRateReference: number
  onOpen: () => void
  onTogglePin: () => void
  onMove: (stageId: string) => void
}

export function OpportunityCard({
  row,
  stages,
  today,
  dailyRateReference,
  onOpen,
  onTogglePin,
  onMove
}: Props) {
  const { ref, handleRef, isDragging } = useBoardCard(BOARD_ID, row.id, row.stageId, row.recruiter)

  // Everything the card can be moved to — its own column is not a destination.
  const destinations = stages.filter((stage) => !stage.isArchived && stage.id !== row.stageId)

  return (
    <div
      ref={ref}
      className={cn(
        CARD_LAYOUT,
        'hover:border-border-strong',
        row.isPinned && 'bg-accent/35',
        isDragging && 'opacity-40'
      )}
    >
      <div className="flex items-start gap-1.5">
        <DragHandle ref={handleRef} label={m.board_dragHandle()} />

        <button
          type="button"
          onClick={onOpen}
          aria-label={m.board_openCard({ recruiter: row.recruiter })}
          // Stretched over the card so the whole surface opens the panel, without nesting the
          // menu and the pin button inside a button.
          className="focus-visible:ring-ring min-w-0 flex-1 text-left after:absolute after:inset-0 after:rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          {/* The need leads when there is one; without it the recruiter is the card's identity,
              and a bare dash above a name would be the only title. */}
          <span className="block truncate font-semibold">{row.need ?? row.recruiter}</span>
          {row.need !== null && (
            <span className="text-muted-foreground block truncate text-xs">{row.recruiter}</span>
          )}
        </button>

        <div className="relative z-10 flex flex-none items-center">
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
      {(row.esn !== null || row.endClient !== null) && (
        <div className="text-muted-foreground flex min-w-0 flex-col gap-0.5 text-xs">
          {row.esn !== null && <span className="truncate">{row.esn}</span>}
          {row.endClient !== null && <span className="truncate">{row.endClient}</span>}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold',
            row.isDue ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {row.isDue && <Bell className="size-3" />}
          {formatRelativeDate(row.lastContactAt, today)}
        </span>
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
      </div>
    </div>
  )
}
