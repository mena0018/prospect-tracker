import { ArchiveRestore, Archive, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { m } from '@/i18n/paraglide/messages'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

type Props = {
  row: OpportunityRow
  onEdit: () => void
  onToggleArchive: () => void
  onDelete: () => void
}

export function OpportunityRowActions({ row, onEdit, onToggleArchive, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={m.table_rowActions()}
            className="text-muted-foreground hover:text-foreground"
          />
        }
        // The row itself opens the editor; the menu must not trigger it too.
        onClick={(event) => event.stopPropagation()}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil />
          {m.common_edit()}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleArchive}>
          {row.isArchived ? <ArchiveRestore /> : <Archive />}
          {row.isArchived ? m.opportunity_unarchive() : m.opportunity_archive()}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 />
          {m.common_delete()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
