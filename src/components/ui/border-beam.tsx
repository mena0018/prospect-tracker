import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'

type Props = {
  size?: number
  duration?: number
  delay?: number
  colorFrom?: string
  colorTo?: string
  borderWidth?: number
  className?: string
}

// CSS-only port of Magic UI's border-beam — see docs/reference/border-beam.md
export function BorderBeam({
  size = 50,
  duration = 6,
  delay = 0,
  colorFrom = 'var(--color-destructive)',
  colorTo = 'transparent',
  borderWidth = 1,
  className
}: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--border-beam-width) border-transparent mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect [mask-clip:padding-box,border-box]"
      style={{ '--border-beam-width': `${borderWidth}px` } as CSSProperties}
    >
      <div
        className={cn(
          'animate-border-beam absolute aspect-square',
          'bg-linear-to-l from-(--beam-from) via-(--beam-to) to-transparent',
          className
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            animationDuration: `${duration}s`,
            animationDelay: `${-delay}s`,
            '--beam-from': colorFrom,
            '--beam-to': colorTo
          } as CSSProperties
        }
      />
    </div>
  )
}
