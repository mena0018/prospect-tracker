import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useDebouncedCallback } from '@tanstack/react-pacer/debouncer'

type Props = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> & {
  value: string
  onChange: (value: string) => void
  debounceMs?: number
}

export function DebouncedInput({ value, onChange, debounceMs = 300, ...props }: Props) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)

  // Adjusting during render, not in an effect: an effect re-renders on our own emission.
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }

  const emit = useDebouncedCallback(onChange, { wait: debounceMs })

  return (
    <Input
      {...props}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value)
        emit(event.target.value)
      }}
    />
  )
}
