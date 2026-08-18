import { motion, useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'

type Props = {
  /** Namespaces the shared layout, so two toggles on one page never animate into each other. */
  groupId: string
  isSelected: boolean
  className?: string
}

// The moving half of a segmented control — see docs/reference/toggle-indicator.md
export function ToggleIndicator({ groupId, isSelected, className }: Props) {
  const prefersReducedMotion = useReducedMotion()

  if (!isSelected) return null

  return (
    <motion.span
      aria-hidden
      layoutId={`toggle-indicator-${groupId}`}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: 'spring', visualDuration: 0.22, bounce: 0.18 }
      }
      className={cn(
        'bg-card absolute inset-0 -z-10 rounded-[7px] shadow-sm dark:ring-1 dark:ring-white/10',
        className
      )}
    />
  )
}
