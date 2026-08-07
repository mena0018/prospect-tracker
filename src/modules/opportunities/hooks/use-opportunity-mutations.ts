import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useErrorToast } from '@/hooks/use-error-toast'
import { m } from '@/i18n/paraglide/messages'
import type {
  CreateOpportunityInput,
  UpdateOpportunityInput
} from '@/modules/opportunities/opportunities-schema'
import {
  createOpportunity,
  deleteOpportunity,
  updateOpportunity
} from '@/modules/opportunities/opportunities-server'
import { OPPORTUNITIES_QUERY_KEY } from './use-opportunities'

export function useOpportunityMutations() {
  const queryClient = useQueryClient()
  const showErrorToast = useErrorToast()

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: OPPORTUNITIES_QUERY_KEY })

  const create = useMutation({
    mutationFn: (data: CreateOpportunityInput) => createOpportunity({ data }),
    onSettled: invalidateList,
    onError: (error, data) =>
      showErrorToast(error, {
        title: m.opportunity_createFailed(),
        onRetry: () => create.mutate(data)
      })
  })

  const update = useMutation({
    mutationFn: (data: UpdateOpportunityInput) => updateOpportunity({ data }),
    onSettled: invalidateList,
    onError: (error, data) =>
      showErrorToast(error, {
        title: m.opportunity_updateFailed(),
        onRetry: () => update.mutate(data)
      })
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteOpportunity({ data: { id } }),
    onSettled: invalidateList,
    onError: (error, id) =>
      showErrorToast(error, {
        title: m.opportunity_deleteFailed(),
        onRetry: () => remove.mutate(id)
      })
  })

  return { create, update, remove }
}
