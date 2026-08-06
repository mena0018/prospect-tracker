import { Pin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { m } from '@/i18n/paraglide/messages'
import { cn } from '@/lib/utils'

type Props = {
  isPinned: boolean
  onToggle: () => void
}

export function PinButton({ isPinned, onToggle }: Props) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      title={isPinned ? m.table_unpin() : m.table_pin()}
      aria-pressed={isPinned}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      className={cn(
        'text-muted-foreground hover:text-foreground',
        isPinned && 'text-primary hover:text-primary'
      )}
    >
      <Pin className={cn(isPinned && 'fill-primary')} />
    </Button>
  )
}
