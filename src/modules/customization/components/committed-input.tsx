import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { shouldCommit } from '@/modules/customization/customization-utils'

type Props = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'defaultValue'> & {
  value: string
  onCommit: (value: string) => void
}

// Commits on blur and Enter, never per keystroke — see docs/reference/customization.md
export function CommittedInput({ value, onCommit, ...props }: Props) {
  const [draft, setDraft] = useState(value)

  // The last prop seen, never a locally committed value — see docs/reference/customization.md
  const [lastValue, setLastValue] = useState(value)

  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }

  const commit = () => {
    if (!shouldCommit(draft, value)) {
      setDraft(value)
      return
    }

    const next = draft.trim()

    setDraft(next)
    onCommit(next)
  }

  return (
    <Input
      {...props}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        }
        if (event.key === 'Escape') {
          setDraft(value)
          event.currentTarget.blur()
        }
      }}
    />
  )
}
