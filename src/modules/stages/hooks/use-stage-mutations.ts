import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Stage } from '@/db/schema'
import { useErrorToast } from '@/hooks/use-error-toast'
import { m } from '@/i18n/paraglide/messages'
import { optimisticList, rollbackList } from '@/lib/optimistic'
import { nextPosition } from '@/shared/sortable/sortable-utils'
import { OPPORTUNITIES_QUERY_KEY } from '@/modules/opportunities/hooks/use-opportunities'
import { STAGE_COUNTS_QUERY_KEY } from '@/modules/stages/hooks/use-stage-counts'
import { STAGES_QUERY_KEY } from '@/modules/stages/hooks/use-stages'
import type {
  CreateStageInput,
  ReorderStagesInput,
  SetStageArchivedInput,
  UpdateStageInput
} from '@/modules/stages/stages-schema'
import {
  createStage,
  deleteStage,
  reorderStages,
  setStageArchived,
  updateStage
} from '@/modules/stages/stages-server'
import { nextFreeStageColor } from '@/modules/stages/stages-utils'

type RemoveStageInput = {
  id: string
  onConflict?: () => void
}

const DEFAULT_REMINDER_DELAY_DAYS = 7

export function useStageMutations() {
  const queryClient = useQueryClient()
  const showErrorToast = useErrorToast()

  // The counts key sits under OPPORTUNITIES_QUERY_KEY, so it is named rather than reached through
  // the parent — refetching every opportunity to refresh a per-stage count is the expensive way.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: STAGES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: STAGE_COUNTS_QUERY_KEY })
    ])

  // reminder_delay_days feeds isDueExpression — see docs/reference/customization.md
  const invalidateWithDue = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: STAGES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: OPPORTUNITIES_QUERY_KEY })
    ])

  // Mirrors createStage's defaults — see docs/reference/customization.md
  const create = useMutation({
    mutationFn: (data: CreateStageInput) => createStage({ data }),

    onMutate: async (input) => {
      const optimisticId = crypto.randomUUID()

      const context = await optimisticList<Stage>(queryClient, STAGES_QUERY_KEY, (current) => [
        ...current,
        {
          id: optimisticId,
          userId: '',
          name: input.name,
          color: input.color ?? nextFreeStageColor(current.map((stage) => stage.color)),
          position: nextPosition(current),
          systemKey: null,
          reminderDelayDays: input.reminderDelayDays ?? DEFAULT_REMINDER_DELAY_DAYS,
          isArchived: false,
          createdAt: new Date()
        }
      ])

      return { ...context, optimisticId }
    },

    onSuccess: (created, _variables, { optimisticId }) => {
      queryClient.setQueryData<Stage[]>(STAGES_QUERY_KEY, (current) =>
        current?.map((stage) => (stage.id === optimisticId ? created : stage))
      )
    },

    onError: (error, _variables, context) => {
      rollbackList(queryClient, STAGES_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_stageCreateFailed() })
    },

    onSettled: invalidate
  })

  const update = useMutation({
    mutationFn: (data: UpdateStageInput) => updateStage({ data }),

    onMutate: ({ id, ...patch }) =>
      optimisticList<Stage>(queryClient, STAGES_QUERY_KEY, (current) =>
        current.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage))
      ),

    onError: (error, _variables, context) => {
      rollbackList(queryClient, STAGES_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_stageUpdateFailed() })
    },

    // A rename or recolor changes nothing an opportunity query returns; only the delay does.
    onSettled: (_data, _error, { reminderDelayDays }) =>
      reminderDelayDays === undefined ? invalidate() : invalidateWithDue()
  })

  const setArchived = useMutation({
    mutationFn: (data: SetStageArchivedInput) => setStageArchived({ data }),

    onMutate: ({ id, isArchived }) =>
      optimisticList<Stage>(queryClient, STAGES_QUERY_KEY, (current) => {
        const next = current.map((stage) => (stage.id === id ? { ...stage, isArchived } : stage))

        // Only a restore re-appends; archiving leaves the row where it is, as the server does.
        const restored = next.find((stage) => stage.id === id)

        return isArchived || !restored
          ? next
          : [...next.filter((stage) => stage.id !== id), restored]
      }),

    onError: (error, _variables, context) => {
      rollbackList(queryClient, STAGES_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_stageUpdateFailed() })
    },

    // isArchivedRow ORs the stage's flag into every one of its opportunities, so archiving a stage
    // moves them all between the active and archived tabs.
    onSettled: invalidateWithDue
  })

  const reorder = useMutation({
    mutationFn: (data: ReorderStagesInput) => reorderStages({ data }),

    onMutate: ({ ids }) =>
      optimisticList<Stage>(queryClient, STAGES_QUERY_KEY, (current) => {
        const byId = new Map(current.map((stage) => [stage.id, stage]))
        return ids.flatMap((id) => byId.get(id) ?? [])
      }),

    onError: (error, _variables, context) => {
      rollbackList(queryClient, STAGES_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_stageReorderFailed() })
    },

    onSettled: invalidate
  })

  const remove = useMutation({
    mutationFn: ({ id }: RemoveStageInput) => deleteStage({ data: { id } }),

    onMutate: ({ id }) =>
      optimisticList<Stage>(queryClient, STAGES_QUERY_KEY, (current) =>
        current.filter((stage) => stage.id !== id)
      ),

    // Rollback runs before onConflict so the blocked dialog names a row that is back on screen.
    onError: (error, { onConflict }, context) => {
      rollbackList(queryClient, STAGES_QUERY_KEY, context)

      if (error instanceof Error && error.message === 'CONFLICT' && onConflict) {
        onConflict()
        return
      }

      showErrorToast(error, { title: m.customize_stageDeleteFailed() })
    },

    onSettled: invalidate
  })

  return { create, update, setArchived, reorder, remove }
}
