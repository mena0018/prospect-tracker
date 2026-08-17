import { useState } from 'react'
import { X } from 'lucide-react'

import { InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { m } from '@/i18n/paraglide/messages'
import { useDebouncer } from '@tanstack/react-pacer/debouncer'

const DEBOUNCE_MS = 300

type Props = Omit<React.ComponentProps<typeof InputGroupInput>, 'value' | 'onChange'> & {
  value: string
  onChange: (value: string) => void
  clearable?: boolean
}

export function DebouncedInput({ value, onChange, clearable = false, ...props }: Props) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)

  // Adjusting during render, not in an effect: an effect re-renders on our own emission.
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }

  const debouncer = useDebouncer(onChange, { wait: DEBOUNCE_MS })

  return (
    <>
      <InputGroupInput
        {...props}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          debouncer.maybeExecute(event.target.value)
        }}
      />
      {clearable && draft ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={m.common_clear()}
            onClick={() => {
              debouncer.cancel()
              setDraft('')
              setLastValue('')
              onChange('')
            }}
            className="text-muted-foreground hover:text-foreground rounded-full"
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </>
  )
}
