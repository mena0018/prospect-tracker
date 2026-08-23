import { z } from 'zod/v4'

import { m } from '@/i18n/paraglide/messages'

// Namespaces the drag so two sortable lists on one page cannot accept each other's rows.
export const JOB_TYPES_LIST_ID = 'job-types'

const JOB_TYPE_NAME_MAX_LENGTH = 60

const jobTypeName = z
  .string()
  .trim()
  .min(1, { error: () => m.validation_configNameRequired() })
  .max(JOB_TYPE_NAME_MAX_LENGTH, { error: () => m.validation_configNameTooLong() })

export const createJobTypeSchema = z.object({ name: jobTypeName })

export const updateJobTypeSchema = z.object({
  id: z.uuid(),
  name: jobTypeName
})

export const reorderJobTypesSchema = z.object({
  ids: z.array(z.uuid()).min(1)
})

export const deleteJobTypeSchema = z.object({ id: z.uuid() })

export type CreateJobTypeInput = z.infer<typeof createJobTypeSchema>
export type UpdateJobTypeInput = z.infer<typeof updateJobTypeSchema>
export type ReorderJobTypesInput = z.infer<typeof reorderJobTypesSchema>
export type DeleteJobTypeInput = z.infer<typeof deleteJobTypeSchema>
