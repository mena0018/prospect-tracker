import { z } from 'zod/v4'

const formErrorSchema = z.union([z.string(), z.object({ form: z.string() })])

// TanStack Form types errorMap entries as unknown; onSubmitAsync returns { form: string }.
export function toErrorMessage(error: unknown): string | null {
  const parsed = formErrorSchema.safeParse(error)
  if (!parsed.success) return null
  return typeof parsed.data === 'string' ? parsed.data : parsed.data.form
}
