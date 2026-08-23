import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useErrorToast } from '@/hooks/use-error-toast'
import { m } from '@/i18n/paraglide/messages'
import type { UpdateDailyRateReferenceInput } from '@/modules/customization/customization-schema'
import { updateDailyRateReference } from '@/modules/customization/customization-server'
import { DAILY_RATE_REFERENCE_QUERY_KEY } from '@/modules/customization/hooks/use-daily-rate-reference'
import { OPPORTUNITIES_QUERY_KEY } from '@/modules/opportunities/hooks/use-opportunities'

export function useDailyRateReferenceMutation() {
  const queryClient = useQueryClient()
  const showErrorToast = useErrorToast()

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: DAILY_RATE_REFERENCE_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: OPPORTUNITIES_QUERY_KEY })
    ])

  const update = useMutation({
    mutationFn: (data: UpdateDailyRateReferenceInput) => updateDailyRateReference({ data }),
    onSettled: invalidate,
    onError: (error) => showErrorToast(error, { title: m.customize_dailyRateUpdateFailed() })
  })

  return { update }
}
