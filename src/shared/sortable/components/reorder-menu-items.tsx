import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine } from 'lucide-react'

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { m } from '@/i18n/paraglide/messages'

type Props = {
  isFirst: boolean
  isLast: boolean
  onMoveToTop: () => void
  onMove: (direction: -1 | 1) => void
  onMoveToBottom: () => void
}

export function ReorderMenuItems({ isFirst, isLast, onMoveToTop, onMove, onMoveToBottom }: Props) {
  if (isFirst && isLast) return null

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuLabel>{m.sortable_reorderGroupLabel()}</DropdownMenuLabel>
        <DropdownMenuItem disabled={isFirst} onClick={onMoveToTop}>
          <ArrowUpToLine />
          {m.sortable_moveToTop()}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isFirst} onClick={() => onMove(-1)}>
          <ArrowUp />
          {m.sortable_moveUp()}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isLast} onClick={() => onMove(1)}>
          <ArrowDown />
          {m.sortable_moveDown()}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isLast} onClick={onMoveToBottom}>
          <ArrowDownToLine />
          {m.sortable_moveToBottom()}
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
    </>
  )
}
