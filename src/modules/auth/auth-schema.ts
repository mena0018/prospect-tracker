import { z } from 'zod/v4'

import { m } from '@/i18n/paraglide/messages'

export const credentialsSchema = z.object({
  email: z.email({ error: () => m.validation_emailInvalid() }),
  password: z.string().min(8, { error: () => m.validation_passwordTooShort() })
})

export const signUpSchema = credentialsSchema.extend({
  fullName: z
    .string()
    .min(1, { error: () => m.validation_fullNameRequired() })
    .max(100, { error: () => m.validation_fullNameTooLong() })
})

// Form-only: confirmPassword is never sent to the server, so it stays out of signUpSchema
export const signUpFormSchema = signUpSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    error: () => m.validation_passwordsMismatch(),
    path: ['confirmPassword']
  })
