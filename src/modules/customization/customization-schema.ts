import { z } from 'zod/v4'

import { m } from '@/i18n/paraglide/messages'

export const updateDailyRateReferenceSchema = z.object({
  dailyRateReference: z
    .int({ error: () => m.validation_dailyRateInt() })
    .min(0, { error: () => m.validation_dailyRateNegative() })
    .max(10000, { error: () => m.validation_dailyRateTooHigh() })
})

export type UpdateDailyRateReferenceInput = z.infer<typeof updateDailyRateReferenceSchema>
