import { QUERY_KEYS } from '@/lib/query-key'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createOpportunity,
  deleteOpportunity,
  updateOpportunity
} from '@/modules/opportunities/opportunities-server'
import type {
  CreateOpportunityInput,
  UpdateOpportunityInput
} from '@/modules/opportunities/opportunities-schema'

export function useOpportunityMutations() {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.opportunities.all })

  const create = useMutation({
    mutationFn: (data: CreateOpportunityInput) => createOpportunity({ data }),
    onSuccess: invalidateList
  })

  const update = useMutation({
    mutationFn: (data: UpdateOpportunityInput) => updateOpportunity({ data }),
    onSuccess: invalidateList
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteOpportunity({ data: { id } }),
    onSuccess: invalidateList
  })

  return { create, update, remove }
}
