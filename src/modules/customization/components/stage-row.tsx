import { Archive, MoreHorizontal, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DragHandle,
  DropIndicator,
  sortableRowShell
} from '@/shared/sortable/components/sortable-row'
import { ReorderMenuItems } from '@/shared/sortable/components/reorder-menu-items'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import type { Stage, StageColorToken } from '@/db/schema'
import { useSortableItem } from '@/shared/sortable/hooks/use-sortable-list'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import { STAGES_LIST_ID } from '@/modules/stages/stages-utils'
import { REMINDER_DELAY_MAX_DAYS } from '@/modules/stages/stages-schema'
import { CommittedInput } from '@/modules/customization/components/committed-input'
import { CommittedNumberInput } from '@/modules/customization/components/committed-number-input'
import { StageColorPicker } from '@/modules/customization/components/stage-color-picker'

type Props = {
  stage: Stage
  count: number
  index: number
  isFirst: boolean
  isLast: boolean
  onRename: (name: string) => void
  onRecolor: (color: StageColorToken) => void
  onDelayChange: (days: number) => void
  onMove: (direction: -1 | 1) => void
  onMoveToTop: () => void
  onMoveToBottom: () => void
  onArchive: () => void
  onDelete: () => void
}

export function StageRow({
  stage,
  count,
  index,
  isFirst,
  isLast,
  onRename,
  onRecolor,
  onDelayChange,
  onMove,
  onMoveToTop,
  onMoveToBottom,
  onArchive,
  onDelete
}: Props) {
  const nameId = `stage-name-${stage.id}`
  const delayId = `stage-delay-${stage.id}`
  const { ref, handleRef, isDragging, closestEdge } = useSortableItem(
    STAGES_LIST_ID,
    stage.id,
    index
  )

  return (
    <div
      ref={ref}
      className={cn(sortableRowShell(isFirst, isLast), 'p-3.5', isDragging && 'opacity-40')}
    >
      <DropIndicator edge={closestEdge} />
      <div className="flex items-center gap-3">
        <DragHandle ref={handleRef} label={m.sortable_dragHandle()} />

        <StageColorPicker color={stage.color} onSelect={onRecolor} />

        <Label htmlFor={nameId} className="sr-only">
          {m.customize_stageNameLabel()}
        </Label>
        <CommittedInput
          id={nameId}
          size="form"
          value={stage.name}
          onCommit={onRename}
          className="min-w-0 flex-1 font-medium"
        />

        <div className="relative w-28 flex-none">
          <Label htmlFor={delayId} className="sr-only">
            {m.customize_stageDelayLabel()}
          </Label>
          <CommittedNumberInput
            id={delayId}
            size="form"
            min={0}
            max={REMINDER_DELAY_MAX_DAYS}
            value={stage.reminderDelayDays}
            onCommit={onDelayChange}
            className="pr-13 font-semibold tabular-nums"
          />
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
            {m.customize_stageDelayUnit()}
          </span>
        </div>

        <span className="text-muted-foreground flex-none text-right text-xs whitespace-nowrap tabular-nums">
          {m.customize_stageCount({ count })}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon-md"
                className="flex-none"
                aria-label={m.customize_moreActions()}
                title={m.customize_moreActions()}
              />
            }
          >
            <MoreHorizontal className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-46.5">
            <ReorderMenuItems
              isFirst={isFirst}
              isLast={isLast}
              onMoveToTop={onMoveToTop}
              onMove={onMove}
              onMoveToBottom={onMoveToBottom}
            />
            <DropdownMenuItem onClick={onArchive}>
              <Archive />
              {m.customize_archive()}
            </DropdownMenuItem>
            {stage.systemKey === null && (
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 />
                {m.common_delete()}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-muted-foreground mt-2.5 pl-15 text-xs">
        {m.customize_stageDelayHelp({ count: stage.reminderDelayDays })}
      </p>
    </div>
  )
}

// Kept beside StageRow so a size change here is not forgotten in the placeholder.
export function StageRowSkeleton() {
  return (
    <div className="border-border bg-card rounded-xl border p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3">
        <Skeleton className="size-6 flex-none rounded-md" />
        <Skeleton className="size-6 flex-none rounded-md" />
        <Skeleton className="h-8.75 min-w-0 flex-1 rounded-md" />
        <Skeleton className="h-8.75 w-28 flex-none rounded-md" />
        <Skeleton className="h-3 w-24 flex-none" />
        <Skeleton className="size-9.5 flex-none rounded-md" />
      </div>
      <Skeleton className="mt-2.5 ml-15 h-4.25 w-64" />
    </div>
  )
}
