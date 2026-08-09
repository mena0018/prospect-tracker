import { queryOptions, useQuery } from '@tanstack/react-query'
import { getCustomization } from '@/modules/customization/customization-server'

const CUSTOMIZATION_QUERY_KEY = ['customization']

export const customizationQueryOptions = () =>
  queryOptions({
    queryKey: CUSTOMIZATION_QUERY_KEY,
    queryFn: () => getCustomization()
  })

export function useCustomization() {
  return useQuery(customizationQueryOptions())
}
