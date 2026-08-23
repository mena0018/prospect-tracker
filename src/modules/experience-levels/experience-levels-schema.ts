import { z } from 'zod/v4'

import { m } from '@/i18n/paraglide/messages'

// Namespaces the drag so two sortable lists on one page cannot accept each other's rows.
export const EXPERIENCE_LEVELS_LIST_ID = 'experience-levels'

const EXPERIENCE_LEVEL_NAME_MAX_LENGTH = 60

const experienceLevelName = z
  .string()
  .trim()
  .min(1, { error: () => m.validation_configNameRequired() })
  .max(EXPERIENCE_LEVEL_NAME_MAX_LENGTH, { error: () => m.validation_configNameTooLong() })

export const createExperienceLevelSchema = z.object({ name: experienceLevelName })

export const updateExperienceLevelSchema = z.object({
  id: z.uuid(),
  name: experienceLevelName
})

export const reorderExperienceLevelsSchema = z.object({
  ids: z.array(z.uuid()).min(1)
})

export const deleteExperienceLevelSchema = z.object({ id: z.uuid() })

export type CreateExperienceLevelInput = z.infer<typeof createExperienceLevelSchema>
export type UpdateExperienceLevelInput = z.infer<typeof updateExperienceLevelSchema>
export type ReorderExperienceLevelsInput = z.infer<typeof reorderExperienceLevelsSchema>
export type DeleteExperienceLevelInput = z.infer<typeof deleteExperienceLevelSchema>
