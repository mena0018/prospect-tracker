import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ExperienceLevel } from '@/db/schema'
import { useErrorToast } from '@/hooks/use-error-toast'
import { m } from '@/i18n/paraglide/messages'
import { optimisticList, rollbackList } from '@/lib/optimistic'
import { nextPosition } from '@/shared/sortable/sortable-utils'
import { EXPERIENCE_LEVEL_COUNTS_QUERY_KEY } from '@/modules/experience-levels/hooks/use-experience-level-counts'
import { EXPERIENCE_LEVELS_QUERY_KEY } from '@/modules/experience-levels/hooks/use-experience-levels'
import type {
  CreateExperienceLevelInput,
  ReorderExperienceLevelsInput,
  UpdateExperienceLevelInput
} from '@/modules/experience-levels/experience-levels-schema'
import {
  createExperienceLevel,
  deleteExperienceLevel,
  reorderExperienceLevels,
  updateExperienceLevel
} from '@/modules/experience-levels/experience-levels-server'
import { OPPORTUNITIES_QUERY_KEY } from '@/modules/opportunities/hooks/use-opportunities'

export function useExperienceLevelMutations() {
  const queryClient = useQueryClient()
  const showErrorToast = useErrorToast()

  // The opportunities query stores the FK, not the name, so a create, rename or reorder changes
  // nothing it returns.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: EXPERIENCE_LEVELS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: EXPERIENCE_LEVEL_COUNTS_QUERY_KEY })
    ])

  // Deleting sets that FK null on every opportunity holding it, so the table has to refetch too.
  const invalidateWithRows = () =>
    Promise.all([
      invalidate(),
      queryClient.invalidateQueries({ queryKey: OPPORTUNITIES_QUERY_KEY })
    ])

  const create = useMutation({
    mutationFn: (data: CreateExperienceLevelInput) => createExperienceLevel({ data }),

    onMutate: async (input) => {
      const optimisticId = crypto.randomUUID()

      const context = await optimisticList<ExperienceLevel>(
        queryClient,
        EXPERIENCE_LEVELS_QUERY_KEY,
        (current) => [
          ...current,
          {
            id: optimisticId,
            userId: '',
            name: input.name,
            position: nextPosition(current),
            createdAt: new Date()
          }
        ]
      )

      return { ...context, optimisticId }
    },

    onSuccess: (created, _variables, { optimisticId }) => {
      queryClient.setQueryData<ExperienceLevel[]>(EXPERIENCE_LEVELS_QUERY_KEY, (current) =>
        current?.map((item) => (item.id === optimisticId ? created : item))
      )
    },

    onError: (error, _variables, context) => {
      rollbackList(queryClient, EXPERIENCE_LEVELS_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_itemCreateFailed() })
    },

    onSettled: invalidate
  })

  const update = useMutation({
    mutationFn: (data: UpdateExperienceLevelInput) => updateExperienceLevel({ data }),

    onMutate: ({ id, ...patch }) =>
      optimisticList<ExperienceLevel>(queryClient, EXPERIENCE_LEVELS_QUERY_KEY, (current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item))
      ),

    onError: (error, _variables, context) => {
      rollbackList(queryClient, EXPERIENCE_LEVELS_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_itemUpdateFailed() })
    },

    onSettled: invalidate
  })

  const reorder = useMutation({
    mutationFn: (data: ReorderExperienceLevelsInput) => reorderExperienceLevels({ data }),

    onMutate: ({ ids }) =>
      optimisticList<ExperienceLevel>(queryClient, EXPERIENCE_LEVELS_QUERY_KEY, (current) => {
        const byId = new Map(current.map((item) => [item.id, item]))

        return ids.flatMap((id) => byId.get(id) ?? [])
      }),

    onError: (error, _variables, context) => {
      rollbackList(queryClient, EXPERIENCE_LEVELS_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_itemUpdateFailed() })
    },

    onSettled: invalidate
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteExperienceLevel({ data: { id } }),

    onMutate: (id) =>
      optimisticList<ExperienceLevel>(queryClient, EXPERIENCE_LEVELS_QUERY_KEY, (current) =>
        current.filter((item) => item.id !== id)
      ),

    onError: (error, _variables, context) => {
      rollbackList(queryClient, EXPERIENCE_LEVELS_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_itemDeleteFailed() })
    },

    onSettled: invalidateWithRows
  })

  return { create, update, reorder, remove }
}
