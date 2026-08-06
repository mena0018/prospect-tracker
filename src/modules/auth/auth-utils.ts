import { z } from 'zod/v4'

import { type ErrorCode } from '@/lib/error'

// GoTrue codes are grouped by the action they leave the user: fix input, wait, or nothing.
// Unlisted codes fall back to SERVER — see docs/decisions/0003-auth-error-mapping.md
const AUTH_ERROR_CODES: Record<string, ErrorCode> = {
  invalid_credentials: 'AUTH_INVALID_CREDENTIALS',
  user_already_exists: 'AUTH_EMAIL_TAKEN',
  email_exists: 'AUTH_EMAIL_TAKEN',
  email_address_invalid: 'VALIDATION',
  validation_failed: 'VALIDATION',
  weak_password: 'VALIDATION',
  over_email_send_rate_limit: 'RATE_LIMITED',
  over_request_rate_limit: 'RATE_LIMITED',
  request_timeout: 'RATE_LIMITED',
  user_banned: 'AUTH_ACCOUNT_LOCKED',
  signup_disabled: 'AUTH_SIGNUP_DISABLED',
  email_provider_disabled: 'AUTH_SIGNUP_DISABLED'
}

export function toAuthErrorCode(code: string | undefined): ErrorCode {
  return (code && AUTH_ERROR_CODES[code]) || 'SERVER'
}

const formErrorSchema = z.union([z.string(), z.object({ form: z.string() })])

// TanStack Form types errorMap entries as unknown; onSubmitAsync returns { form: ErrorCode }.
export function toFormErrorCode(error: unknown): string | null {
  const parsed = formErrorSchema.safeParse(error)
  if (!parsed.success) return null
  return typeof parsed.data === 'string' ? parsed.data : parsed.data.form
}

export function toDisplayName(fullName: string | null) {
  if (!fullName) return 'N/C'

  const [first = '', second = ''] = fullName.split(/\s+/).filter(Boolean)
  return `${first}. ${second[0] ?? ''}`.trim()
}

export function toInitials(fullName: string | null) {
  if (!fullName) return 'N/C'

  const [first = '', second = ''] = fullName.split(/\s+/).filter(Boolean)
  return ((first[0] ?? '') + (second[0] ?? first[1] ?? '')).toUpperCase()
}

// Google sign-ups and accounts created before the job-title field fall back to the email.
export function toProfileSubtitle(jobTitle: string | null, email: string) {
  const trimmed = jobTitle?.trim()
  return trimmed ? trimmed : email
}
