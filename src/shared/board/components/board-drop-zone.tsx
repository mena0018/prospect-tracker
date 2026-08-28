import { cn } from '@/lib/utils'

// An empty column keeps its footprint and says it accepts a drop, rather than collapsing to a
// header — see docs/reference/board-mechanism.md
export function BoardDropZone({ label, isOver }: { label: string; isOver: boolean }) {
  return (
    <div
      className={cn(
        'text-muted-foreground flex min-h-24 flex-1 items-center justify-center rounded-lg',
        'border border-dashed px-3 text-center text-xs transition-colors',
        isOver ? 'border-primary text-primary bg-primary/5' : 'border-border'
      )}
    >
      {label}
    </div>
  )
}
