import { z } from 'zod/v4'

import { m } from '@/i18n/paraglide/messages'
import { toSafeRedirect } from '@/modules/auth/utils/identity'

export const loginSearchSchema = z.object({
  // Drop off-origin redirects at the edge rather than at each navigate site
  redirect: z
    .string()
    .optional()
    .transform((value) => toSafeRedirect(value, undefined)),
  error: z.string().optional(),
  mode: z.enum(['signin', 'signup']).default('signin')
})

export const credentialsSchema = z.object({
  email: z.email({ error: () => m.validation_emailInvalid() }),
  password: z.string().min(8, { error: () => m.validation_passwordTooShort() })
})

export const signUpSchema = credentialsSchema.extend({
  fullName: z
    .string()
    .min(1, { error: () => m.validation_fullNameRequired() })
    .max(100, { error: () => m.validation_fullNameTooLong() }),
  jobTitle: z
    .string()
    .trim()
    .min(1, { error: () => m.validation_jobTitleRequired() })
    .max(100, { error: () => m.validation_jobTitleTooLong() })
})

// Form-only: confirmPassword is never sent to the server, so it stays out of signUpSchema
export const signUpFormSchema = signUpSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    error: () => m.validation_passwordsMismatch(),
    path: ['confirmPassword']
  })

export type AuthUser = {
  id: string
  email: string
  fullName: string | null
  jobTitle: string | null
  avatarUrl: string | null
  provisioned: boolean
}
