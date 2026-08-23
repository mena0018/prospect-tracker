import { useAnnounce } from '@/shared/sortable/hooks/use-announce'
import { m } from '@/i18n/paraglide/messages'

type Item = { id: string; name: string }

export function useReorderAnnouncer(items: readonly Item[], commit: (ids: string[]) => void) {
  const { message, announce } = useAnnounce()

  const commitOrder = (ids: string[], movedId: string) => {
    commit(ids)

    const moved = items.find((item) => item.id === movedId)
    const position = ids.indexOf(movedId)
    if (!moved || position < 0) return

    announce(
      m.sortable_reorderAnnounce({ name: moved.name, position: position + 1, total: ids.length })
    )
  }

  return { message, commitOrder }
}
