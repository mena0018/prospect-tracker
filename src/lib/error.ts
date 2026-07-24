import { m } from '@/i18n/paraglide/messages'

// Functions, not calls — calling m.*() here freezes the locale. See docs/reference/i18n.md
const ERROR_MESSAGES = {
  NOT_FOUND: m.error_notFound,
  FORBIDDEN: m.error_forbidden,
  VALIDATION: m.error_validation,
  CONFLICT: m.error_conflict,
  RATE_LIMITED: m.error_rateLimited,
  SERVER: m.error_server
} as const

type ErrorCode = keyof typeof ERROR_MESSAGES

function isErrorCode(value: string): value is ErrorCode {
  return value in ERROR_MESSAGES
}

export function appError(code: ErrorCode) {
  return new Error(code)
}

// An unknown message (crash, network drop) is replaced: it could leak internals
export function toErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : null
  const message = code && isErrorCode(code) ? ERROR_MESSAGES[code] : ERROR_MESSAGES.SERVER

  return message()
}
