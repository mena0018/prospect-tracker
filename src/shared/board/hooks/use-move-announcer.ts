import { useAnnounce } from '@/shared/sortable/hooks/use-announce'
import { m } from '@/i18n/paraglide/messages'

type Column = { id: string; name: string }
type Card = { id: string; name: string }

// A move changes no focus and adds no text, so nothing reaches a screen reader on its own —
// same reasoning as the sortable announcer. See docs/reference/board-mechanism.md
export function useMoveAnnouncer(
  cards: readonly Card[],
  columns: readonly Column[],
  commit: (cardId: string, toColumnId: string) => void
) {
  const { message, announce } = useAnnounce()

  const commitMove = (cardId: string, toColumnId: string) => {
    commit(cardId, toColumnId)

    const card = cards.find((entry) => entry.id === cardId)
    const column = columns.find((entry) => entry.id === toColumnId)
    if (!card || !column) return

    announce(m.board_moveAnnounce({ name: card.name, column: column.name }))
  }

  return { message, commitMove }
}
