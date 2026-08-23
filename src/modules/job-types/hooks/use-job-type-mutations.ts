import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { JobType } from '@/db/schema'
import { useErrorToast } from '@/hooks/use-error-toast'
import { m } from '@/i18n/paraglide/messages'
import { optimisticList, rollbackList } from '@/lib/optimistic'
import { nextPosition } from '@/shared/sortable/sortable-utils'
import { JOB_TYPE_COUNTS_QUERY_KEY } from '@/modules/job-types/hooks/use-job-type-counts'
import { JOB_TYPES_QUERY_KEY } from '@/modules/job-types/hooks/use-job-types'
import type {
  CreateJobTypeInput,
  ReorderJobTypesInput,
  UpdateJobTypeInput
} from '@/modules/job-types/job-types-schema'
import {
  createJobType,
  deleteJobType,
  reorderJobTypes,
  updateJobType
} from '@/modules/job-types/job-types-server'
import { OPPORTUNITIES_QUERY_KEY } from '@/modules/opportunities/hooks/use-opportunities'

export function useJobTypeMutations() {
  const queryClient = useQueryClient()
  const showErrorToast = useErrorToast()

  // The opportunities query stores the FK, not the name, so a create, rename or reorder changes
  // nothing it returns.
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: JOB_TYPES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: JOB_TYPE_COUNTS_QUERY_KEY })
    ])

  // Deleting sets that FK null on every opportunity holding it, so the table has to refetch too.
  const invalidateWithRows = () =>
    Promise.all([
      invalidate(),
      queryClient.invalidateQueries({ queryKey: OPPORTUNITIES_QUERY_KEY })
    ])

  const create = useMutation({
    mutationFn: (data: CreateJobTypeInput) => createJobType({ data }),

    onMutate: async (input) => {
      const optimisticId = crypto.randomUUID()

      const context = await optimisticList<JobType>(queryClient, JOB_TYPES_QUERY_KEY, (current) => [
        ...current,
        {
          id: optimisticId,
          userId: '',
          name: input.name,
          position: nextPosition(current),
          createdAt: new Date()
        }
      ])

      return { ...context, optimisticId }
    },

    onSuccess: (created, _variables, { optimisticId }) => {
      queryClient.setQueryData<JobType[]>(JOB_TYPES_QUERY_KEY, (current) =>
        current?.map((item) => (item.id === optimisticId ? created : item))
      )
    },

    onError: (error, _variables, context) => {
      rollbackList(queryClient, JOB_TYPES_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_itemCreateFailed() })
    },

    onSettled: invalidate
  })

  const update = useMutation({
    mutationFn: (data: UpdateJobTypeInput) => updateJobType({ data }),

    onMutate: ({ id, ...patch }) =>
      optimisticList<JobType>(queryClient, JOB_TYPES_QUERY_KEY, (current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item))
      ),

    onError: (error, _variables, context) => {
      rollbackList(queryClient, JOB_TYPES_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_itemUpdateFailed() })
    },

    onSettled: invalidate
  })

  const reorder = useMutation({
    mutationFn: (data: ReorderJobTypesInput) => reorderJobTypes({ data }),

    onMutate: ({ ids }) =>
      optimisticList<JobType>(queryClient, JOB_TYPES_QUERY_KEY, (current) => {
        const byId = new Map(current.map((item) => [item.id, item]))
        return ids.flatMap((id) => byId.get(id) ?? [])
      }),

    onError: (error, _variables, context) => {
      rollbackList(queryClient, JOB_TYPES_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_itemUpdateFailed() })
    },

    onSettled: invalidate
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteJobType({ data: { id } }),

    onMutate: (id) =>
      optimisticList<JobType>(queryClient, JOB_TYPES_QUERY_KEY, (current) =>
        current.filter((item) => item.id !== id)
      ),

    onError: (error, _variables, context) => {
      rollbackList(queryClient, JOB_TYPES_QUERY_KEY, context)
      showErrorToast(error, { title: m.customize_itemDeleteFailed() })
    },

    onSettled: invalidateWithRows
  })

  return { create, update, reorder, remove }
}
