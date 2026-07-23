import { z } from 'zod/v4'

import { m } from '@/i18n/paraglide/messages'

// See docs/reference/data-model.md for the nullable + optional rule
const nullableText = z.string().trim().nullable().optional()

export const opportunityFieldsSchema = z.object({
  stageId: z.uuid({ error: () => m.validation_stageRequired() }),
  jobTypeId: z.uuid().nullable().optional(),
  experienceId: z.uuid().nullable().optional(),
  recruiter: z
    .string()
    .trim()
    .min(1, { error: () => m.validation_recruiterRequired() })
    .max(200, { error: () => m.validation_recruiterTooLong() }),
  esn: nullableText,
  endClient: nullableText,
  need: nullableText,
  dailyRate: z
    .int({ error: () => m.validation_dailyRateInt() })
    .min(0, { error: () => m.validation_dailyRateNegative() })
    .max(10000, { error: () => m.validation_dailyRateTooHigh() })
    .nullable()
    .optional(),
  onsiteDays: z
    .int({ error: () => m.validation_onsiteDaysInt() })
    .min(0, { error: () => m.validation_onsiteDaysNegative() })
    .max(5, { error: () => m.validation_onsiteDaysMax() })
    .nullable()
    .optional(),
  location: nullableText,
  lastContactAt: z.iso
    .date({ error: () => m.validation_dateInvalid() })
    .nullable()
    .optional(),
  nextReminderAt: z.iso
    .date({ error: () => m.validation_dateInvalid() })
    .nullable()
    .optional(),
  phone: nullableText,
  offerUrl: z
    .url({ error: () => m.validation_offerUrlInvalid() })
    .nullable()
    .optional(),
  notes: nullableText,
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional()
})

export const createOpportunitySchema = opportunityFieldsSchema

export const updateOpportunitySchema = z.object({
  id: z.uuid(),
  ...opportunityFieldsSchema.partial().shape
})

export const deleteOpportunitySchema = z.object({ id: z.uuid() })

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>
