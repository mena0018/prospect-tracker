import { z } from 'zod'

export const credentialsSchema = z.object({
  email: z.email('Adresse email invalide.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
})

export const signUpSchema = credentialsSchema.extend({
  fullName: z.string().min(1, 'Indiquez votre nom.').max(100, 'Nom trop long (100 max).')
})

// Form-only: confirmPassword is never sent to the server, so it stays out of signUpSchema
export const signUpFormSchema = signUpSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword']
  })
