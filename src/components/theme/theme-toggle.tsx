import { useRef } from 'react'
import { flushSync } from 'react-dom'
import { Moon, Sun } from 'lucide-react'

import { useTheme } from '@/components/theme/theme-provider'
import { Button } from '@/components/ui/button'
import { m } from '@/i18n/paraglide/messages'

const DURATION = 450

function circularReveal(origin: HTMLElement, toggleTheme: () => void) {
  if (!document.startViewTransition) {
    toggleTheme()
    return
  }

  const { top, left, width, height } = origin.getBoundingClientRect()
  const x = left + width / 2
  const y = top + height / 2
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

  document
    .startViewTransition(() => flushSync(toggleTheme))
    .ready.then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: DURATION, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
      )
    )
    .catch(() => {})
}

type Props = {
  className?: string
}

export function ThemeToggle({ className }: Props) {
  const { toggleTheme } = useTheme()
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <Button
      ref={buttonRef}
      variant="outline"
      title={m.theme_toggle()}
      aria-label={m.theme_toggle()}
      size="icon-md"
      className={className}
      onClick={() => circularReveal(buttonRef.current!, toggleTheme)}
    >
      <Sun className="scale-0 rotate-90 transition-all dark:scale-100 dark:-rotate-0" />
      <Moon className="absolute scale-100 rotate-0 transition-all dark:scale-0 dark:rotate-90" />
    </Button>
  )
}
