import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { clampDelay } from '@/modules/customization/customization-utils'

type Props = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'defaultValue'> & {
  value: number
  min: number
  max: number
  onCommit: (value: number) => void
}

// CommittedInput clamped: the delay feeds isDueExpression — see docs/reference/customization.md
export function CommittedNumberInput({ value, min, max, onCommit, ...props }: Props) {
  const [draft, setDraft] = useState(String(value))

  const [lastValue, setLastValue] = useState(value)

  if (value !== lastValue) {
    setLastValue(value)
    setDraft(String(value))
  }

  const commit = () => {
    const next = clampDelay(draft, min, max)

    if (next === null) {
      setDraft(String(value))
      return
    }

    setDraft(String(next))
    if (next === value) return

    onCommit(next)
  }

  return (
    <Input
      {...props}
      type="number"
      min={min}
      max={max}
      step={1}
      inputMode="numeric"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        }
        if (event.key === 'Escape') {
          setDraft(String(value))
          event.currentTarget.blur()
        }
      }}
    />
  )
}
