import { useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { useEffect, useRef } from 'react'

import { cn, formatValue } from '@/lib/utils'

type Props = {
  value: number | null | undefined
  suffix?: string
  className?: string
}

// Port of Magic UI's number-ticker — see docs/reference/number-ticker.md
export function NumberTicker({ value, suffix = '', className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { damping: 60, stiffness: 100 })

  const isAnimatable = typeof value === 'number' && !prefersReducedMotion

  useEffect(() => {
    if (isAnimatable) motionValue.set(value)
  }, [motionValue, value, isAnimatable])

  // The spring writes textContent directly, so React never reconciles it back by itself.
  useEffect(() => {
    if (!isAnimatable) {
      if (ref.current) ref.current.textContent = formatValue(value, suffix)
      return
    }
    return spring.on('change', (latest) => {
      if (ref.current) ref.current.textContent = formatValue(Math.round(latest), suffix)
    })
  }, [spring, suffix, isAnimatable, value])

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {isAnimatable ? formatValue(0, suffix) : formatValue(value, suffix)}
    </span>
  )
}
