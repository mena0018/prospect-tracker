import { z } from 'zod/v4'

import { STAGE_COLOR_TOKENS } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'

export const STAGE_NAME_MAX_LENGTH = 60

// Both a Zod enum and a Postgres CHECK — see docs/decisions/0001-user-configurable-pipeline.md
const stageColor = z.enum(STAGE_COLOR_TOKENS, { error: () => m.validation_stageColorInvalid() })

const stageName = z
  .string()
  .trim()
  .min(1, { error: () => m.validation_stageNameRequired() })
  .max(STAGE_NAME_MAX_LENGTH, { error: () => m.validation_stageNameTooLong() })

// Capped well under the int range: the value lands in a date addition in isDueExpression.
export const REMINDER_DELAY_MAX_DAYS = 90

const reminderDelayDays = z
  .int({ error: () => m.validation_reminderDelayInt() })
  .min(0, { error: () => m.validation_reminderDelayNegative() })
  .max(REMINDER_DELAY_MAX_DAYS, { error: () => m.validation_reminderDelayTooHigh() })

// Color and delay are server-defaulted: the row is created before the user picks either.
export const createStageSchema = z.object({
  name: stageName,
  color: stageColor.optional(),
  reminderDelayDays: reminderDelayDays.optional()
})

// Every field optional: the panel writes one property per interaction (rename, recolor, delay).
export const updateStageSchema = z.object({
  id: z.uuid(),
  name: stageName.optional(),
  color: stageColor.optional(),
  reminderDelayDays: reminderDelayDays.optional()
})

export const setStageArchivedSchema = z.object({
  id: z.uuid(),
  isArchived: z.boolean()
})

// The full ordered list, not a moved pair, so two reorders cannot interleave into gaps.
export const reorderStagesSchema = z.object({
  ids: z.array(z.uuid()).min(1)
})

export const deleteStageSchema = z.object({ id: z.uuid() })

export type CreateStageInput = z.infer<typeof createStageSchema>
export type UpdateStageInput = z.infer<typeof updateStageSchema>
export type SetStageArchivedInput = z.infer<typeof setStageArchivedSchema>
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>
