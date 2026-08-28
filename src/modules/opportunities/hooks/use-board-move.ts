import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useErrorToast } from '@/hooks/use-error-toast'
import { m } from '@/i18n/paraglide/messages'
import { updateOpportunity, type Board } from '@/modules/opportunities/opportunities-server'
import { boardQueryOptions } from '@/modules/opportunities/hooks/use-board'
import { OPPORTUNITIES_QUERY_KEY } from '@/modules/opportunities/hooks/use-opportunities'
import type { GetBoardInput } from '@/modules/opportunities/opportunities-schema'

type MoveInput = { id: string; stageId: string }

// The card jumps columns before the server answers and snaps back when it refuses — the whole
// point of dragging over opening the panel. See docs/reference/kanban-view.md
export function useBoardMove(input: GetBoardInput) {
  const queryClient = useQueryClient()
  const showErrorToast = useErrorToast()
  const { queryKey } = boardQueryOptions(input)

  return useMutation({
    mutationFn: ({ id, stageId }: MoveInput) => updateOpportunity({ data: { id, stageId } }),

    onMutate: async ({ id, stageId }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Board>(queryKey)

      if (previous) {
        queryClient.setQueryData<Board>(queryKey, {
          ...previous,
          rows: previous.rows.map((row) => (row.id === id ? { ...row, stageId } : row))
        })
      }

      return { previous }
    },

    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
      showErrorToast(error, { title: m.opportunity_updateFailed() })
    },

    // Through the parent: a stage change moves the row between tabs and shifts the stage counts.
    onSettled: () => queryClient.invalidateQueries({ queryKey: OPPORTUNITIES_QUERY_KEY })
  })
}
