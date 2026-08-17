import { useState } from 'react'

import { InputGroupInput } from '@/components/ui/input-group'
import { useDebouncer } from '@tanstack/react-pacer/debouncer'

const DEBOUNCE_MS = 300

type Props = Omit<React.ComponentProps<typeof InputGroupInput>, 'value' | 'onChange'> & {
  value: string
  onChange: (value: string) => void
}

export function DebouncedInput({ value, onChange, ...props }: Props) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)

  // What we last handed to `onChange`. The parent round-trips it back through `value` (here via
  // the URL) long after typing has moved on, and that late echo must not overwrite the draft —
  // otherwise "jean" arriving mid-word rewrites an input the user has already retyped.
  const [emitted, setEmitted] = useState(value)

  // Adjusting during render, not in an effect: an effect re-renders on our own emission.
  // Both tests are load-bearing — see docs/reference/server-side-table.md
  if (value !== lastValue) {
    setLastValue(value)

    // Only a value we never emitted is a genuine external change (reset filters, back button).
    if (value !== emitted) {
      setEmitted(value)
      setDraft(value)
    }
  }

  const emit = (next: string) => {
    setEmitted(next)
    onChange(next)
  }

  const debouncer = useDebouncer(emit, { wait: DEBOUNCE_MS })

  return (
    <InputGroupInput
      {...props}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value)
        debouncer.maybeExecute(event.target.value)
      }}
    />
  )
}
