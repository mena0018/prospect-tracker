import { GripVertical } from 'lucide-react'
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'

import { cn } from '@/lib/utils'

// See docs/reference/sortable-mechanism.md
export function sortableRowShell(isFirst: boolean, isLast: boolean) {
  return cn(
    'group/row border-border bg-card relative rounded-xl border transition-opacity',
    'shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
    !isLast && 'after:absolute after:inset-x-0 after:top-full after:h-2.5 after:content-[""]',
    isFirst &&
      'before:absolute before:inset-x-0 before:bottom-full before:h-2.5 before:content-[""]'
  )
}

export function DropIndicator({ edge }: { edge: Edge | null }) {
  if (!edge) return null

  return (
    <div
      aria-hidden
      className={cn(
        'bg-primary pointer-events-none absolute inset-x-0 z-10 h-0.5 rounded-full',
        edge === 'top' ? '-top-1.25' : '-bottom-1.25'
      )}
    />
  )
}

export function DragHandle({ ref, label }: { ref: React.Ref<HTMLButtonElement>; label: string }) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'text-muted-foreground/50 hover:text-foreground hover:bg-muted flex size-6 flex-none',
        'items-center justify-center rounded-md transition-colors',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        'cursor-grab active:cursor-grabbing'
      )}
    >
      <GripVertical className="size-4" />
    </button>
  )
}
