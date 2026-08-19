import { useEffect, useRef, useState } from 'react'

const HIGHLIGHT_MS = 1400

// Flags a field for a beat after the form rewrites it, so the change is not silent.
export function useFieldHighlight() {
  const [isHighlighted, setIsHighlighted] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  const highlight = () => {
    if (timer.current) clearTimeout(timer.current)
    setIsHighlighted(true)
    timer.current = setTimeout(() => setIsHighlighted(false), HIGHLIGHT_MS)
  }

  return { isHighlighted, highlight }
}

// Both states carry the transition, so the ring fades out as well as in — a class that only
// exists while highlighted has nothing to animate back from.
export function highlightClasses(isHighlighted: boolean) {
  return isHighlighted
    ? '[&_input]:border-primary/50 [&_input]:bg-primary/5 [&_input]:ring-primary/35 [&_input]:ring-3 [&_input]:duration-200 [&_input]:ease-out'
    : '[&_input]:ring-0 [&_input]:duration-700 [&_input]:ease-in'
}
