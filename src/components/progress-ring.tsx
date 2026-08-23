import { useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'

const SIZE = 46
const RADIUS = 19.5
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Props = {
  /** 0–100. */
  percent: number
  className?: string
  children?: React.ReactNode
}

// Progress costs no vertical block of its own — see docs/reference/kpis.md
export function ProgressRing({ percent, className, children }: Props) {
  const prefersReducedMotion = useReducedMotion()
  const offset = CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, percent)) / 100)

  return (
    <div className={cn('relative size-11.5 flex-none', className)}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="block -rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={3.5}
          className="stroke-black/8 dark:stroke-white/12"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn(
            'stroke-primary',
            !prefersReducedMotion && 'transition-[stroke-dashoffset]'
          )}
          style={prefersReducedMotion ? undefined : { transitionDuration: '450ms' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
