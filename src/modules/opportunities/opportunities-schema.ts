import { z } from 'zod'

// See docs/reference/data-model.md for the nullable + optional rule
const nullableText = z.string().trim().nullable().optional()

export const opportunityFieldsSchema = z.object({
  stageId: z.uuid("L'étape est obligatoire."),
  jobTypeId: z.uuid().nullable().optional(),
  experienceId: z.uuid().nullable().optional(),
  recruiter: z
    .string()
    .trim()
    .min(1, 'Indiquez le nom du recruteur.')
    .max(200, 'Nom trop long (200 max).'),
  esn: nullableText,
  endClient: nullableText,
  need: nullableText,
  dailyRate: z
    .int('Le TJM doit être un nombre entier.')
    .min(0, 'Le TJM ne peut pas être négatif.')
    .max(10000, 'TJM trop élevé (10 000 max).')
    .nullable()
    .optional(),
  onsiteDays: z
    .int('Le nombre de jours doit être un entier.')
    .min(0, 'Valeur négative impossible.')
    .max(5, 'Maximum 5 jours par semaine.')
    .nullable()
    .optional(),
  location: nullableText,
  lastContactAt: z.iso.date('Date invalide.').nullable().optional(),
  nextReminderAt: z.iso.date('Date invalide.').nullable().optional(),
  phone: nullableText,
  offerUrl: z.url("Lien de l'offre invalide.").nullable().optional(),
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
