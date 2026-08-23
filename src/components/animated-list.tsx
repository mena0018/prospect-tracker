import { useState } from 'react'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

type Props = React.PropsWithChildren

export function AnimatedList({ children }: Props) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) return <div className="-mb-2.5">{children}</div>

  return (
    <motion.div layout className="-mb-2.5">
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </motion.div>
  )
}

export function AnimatedListItem({ children }: React.PropsWithChildren) {
  const prefersReducedMotion = useReducedMotion()
  // Clipping at rest breaks sortable rows — see docs/reference/sortable-mechanism.md
  const [isAnimating, setIsAnimating] = useState(false)

  if (prefersReducedMotion) return <div className="pb-2.5">{children}</div>

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onAnimationStart={() => setIsAnimating(true)}
      onAnimationComplete={() => setIsAnimating(false)}
      transition={{
        layout: { type: 'spring', visualDuration: 0.25, bounce: 0.1 },
        opacity: { duration: 0.15 },
        height: { type: 'spring', visualDuration: 0.25, bounce: 0 }
      }}
      style={{ overflow: isAnimating ? 'hidden' : 'visible' }}
    >
      <div className="pb-2.5">{children}</div>
    </motion.div>
  )
}
