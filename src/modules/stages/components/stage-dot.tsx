import { cn } from '@/lib/utils'

type Props = React.ComponentProps<'span'> & {
  size?: 'sm' | 'md'
}

export function StageDot({ size = 'sm', className, ...props }: Props) {
  return (
    <span
      {...props}
      data-icon="inline-start"
      className={cn(
        'flex-none rounded-full bg-(--stage-dot)',
        size === 'sm' ? 'size-1.75' : 'size-2',
        className
      )}
    />
  )
}
