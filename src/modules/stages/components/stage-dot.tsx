import { cn } from '@/lib/utils'

type Props = {
  size?: 'sm' | 'md'
  className?: string
}

export function StageDot({ size = 'sm', className }: Props) {
  return (
    <span
      data-icon="inline-start"
      className={cn(
        'flex-none rounded-full bg-(--stage-dot)',
        size === 'sm' ? 'size-1.75' : 'size-2',
        className
      )}
    />
  )
}
