import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { StageDot } from '@/modules/stages/components/stage-dot'
import { stageColorVar } from '@/modules/stages/stages-utils'

type Appearance =
  | { variant: 'plain'; withInteraction?: never }
  | { variant?: 'secondary'; withInteraction?: boolean }

type Props = React.ComponentProps<'span'> & { name: string; color: string } & Appearance

export function StageBadge({
  name,
  color,
  variant = 'secondary',
  withInteraction,
  className,
  ...props
}: Props) {
  const style = { '--stage-dot': stageColorVar(color), ...props.style } as React.CSSProperties

  if (variant === 'plain') {
    return (
      <span {...props} style={style} className={cn('flex min-w-0 items-center gap-2', className)}>
        <StageDot size="md" />
        <span className="truncate">{name}</span>
      </span>
    )
  }

  return (
    <Badge
      {...props}
      style={style}
      variant="secondary"
      render={withInteraction ? <button type="button" /> : undefined}
      className={cn(
        withInteraction
          ? 'data-checked:text-foreground h-auto cursor-pointer gap-1.75 rounded-[9px] px-2.75 py-1.5 text-sm font-medium data-checked:border-(--stage-dot) data-checked:bg-(--stage-dot)/12 data-checked:font-semibold'
          : 'text-muted-foreground gap-1.75 rounded-full px-2.25',
        className
      )}
    >
      <StageDot />
      {name}
    </Badge>
  )
}
