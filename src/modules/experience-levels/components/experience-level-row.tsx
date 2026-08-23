import { MoreHorizontal, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DragHandle,
  DropIndicator,
  sortableRowShell
} from '@/shared/sortable/components/sortable-row'
import { ReorderMenuItems } from '@/shared/sortable/components/reorder-menu-items'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import type { ExperienceLevel } from '@/db/schema'
import { useSortableItem } from '@/shared/sortable/hooks/use-sortable-list'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'
import { EXPERIENCE_LEVELS_LIST_ID } from '@/modules/experience-levels/experience-levels-schema'
import { CommittedInput } from '@/modules/customization/components/committed-input'

type Props = {
  experienceLevel: ExperienceLevel
  count: number
  index: number
  isFirst: boolean
  isLast: boolean
  onRename: (name: string) => void
  onMove: (direction: -1 | 1) => void
  onMoveToTop: () => void
  onMoveToBottom: () => void
  onDelete: () => void
}

export function ExperienceLevelRow({
  experienceLevel,
  count,
  index,
  isFirst,
  isLast,
  onRename,
  onMove,
  onMoveToTop,
  onMoveToBottom,
  onDelete
}: Props) {
  const inputId = `experience-level-${experienceLevel.id}`
  const { ref, handleRef, isDragging, closestEdge } = useSortableItem(
    EXPERIENCE_LEVELS_LIST_ID,
    experienceLevel.id,
    index
  )

  return (
    <div
      ref={ref}
      className={cn(
        sortableRowShell(isFirst, isLast),
        'flex items-center gap-3 p-3.5',
        isDragging && 'opacity-40'
      )}
    >
      <DropIndicator edge={closestEdge} />
      <DragHandle ref={handleRef} label={m.sortable_dragHandle()} />

      <Label htmlFor={inputId} className="sr-only">
        {m.customize_levelsSectionTitle()}
      </Label>
      <CommittedInput
        id={inputId}
        size="form"
        value={experienceLevel.name}
        onCommit={onRename}
        className="min-w-0 flex-1 font-medium"
      />

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
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 />
            {m.common_delete()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Beside the row it stands in for, so a padding change here cannot leave the placeholder behind.
export function ExperienceLevelRowSkeleton() {
  return (
    <div className="border-border bg-card flex items-center gap-3 rounded-xl border p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <Skeleton className="size-6 flex-none rounded-md" />
      <Skeleton className="h-8.75 min-w-0 flex-1 rounded-md" />
      <Skeleton className="h-3 w-24 flex-none" />
      <Skeleton className="size-9.5 flex-none rounded-md" />
    </div>
  )
}
