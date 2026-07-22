import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useErrorToast } from '@/hooks/use-error-toast'
import { QUERY_KEYS } from '@/lib/query-key'
import type {
  CreateOpportunityInput,
  UpdateOpportunityInput
} from '@/modules/opportunities/opportunities-schema'
import {
  createOpportunity,
  deleteOpportunity,
  updateOpportunity
} from '@/modules/opportunities/opportunities-server'

export function useOpportunityMutations() {
  const queryClient = useQueryClient()
  const showErrorToast = useErrorToast()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.opportunities.all })

  const create = useMutation({
    mutationFn: (data: CreateOpportunityInput) => createOpportunity({ data }),
    onSettled: invalidateList,
    onError: (error, data) =>
      showErrorToast(error, {
        title: "Impossible d'ajouter l'opportunité",
        onRetry: () => create.mutate(data)
      })
  })

  const update = useMutation({
    mutationFn: (data: UpdateOpportunityInput) => updateOpportunity({ data }),
    onSettled: invalidateList,
    onError: (error, data) =>
      showErrorToast(error, {
        title: 'Impossible de modifier l’opportunité',
        onRetry: () => update.mutate(data)
      })
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteOpportunity({ data: { id } }),
    onSettled: invalidateList,
    onError: (error, id) =>
      showErrorToast(error, {
        title: 'Impossible de supprimer l’opportunité',
        onRetry: () => remove.mutate(id)
      })
  })

  return { create, update, remove }
}
