import { Archive, TriangleAlert } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { m } from '@/i18n/paraglide/messages'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  count: number
  isPending: boolean
  onArchive: () => void
}

// Reached only when the server answered CONFLICT: the stage still holds opportunities and
// opportunities.stage_id is ON DELETE RESTRICT. Archiving is the way out that loses nothing.
export function DeleteStageBlockedDialog({
  open,
  onOpenChange,
  name,
  count,
  isPending,
  onArchive
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>{m.customize_deleteStageBlockedTitle({ name })}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.customize_deleteStageBlockedBody({ count })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
          <AlertDialogAction loading={isPending} onClick={onArchive}>
            <Archive />
            {m.customize_deleteStageBlockedConfirm()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
