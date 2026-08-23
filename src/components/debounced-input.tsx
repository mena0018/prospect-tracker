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
  const [emitted, setEmitted] = useState(value)
  const [lastValue, setLastValue] = useState(value)

  // Adjusted during render, and both tests are load-bearing — see
  // docs/reference/server-side-table.md
  if (value !== lastValue) {
    setLastValue(value)

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
