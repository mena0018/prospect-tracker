export const ERROR_MESSAGES = {
  NOT_FOUND: "Cet élément n'existe plus. Il a peut-être été supprimé.",
  FORBIDDEN: "Vous n'avez pas accès à cet élément.",
  VALIDATION: 'Certaines informations sont invalides. Vérifiez les champs du formulaire.',
  CONFLICT: 'Cet élément a été modifié entre-temps. Rechargez pour voir la dernière version.',
  RATE_LIMITED: 'Trop de tentatives. Patientez quelques instants avant de réessayer.',
  SERVER: 'Une erreur est survenue de notre côté. Réessayez dans un instant.'
} as const

type ErrorCode = keyof typeof ERROR_MESSAGES

const ALLOWED_MESSAGES: readonly string[] = Object.values(ERROR_MESSAGES)

export function appError(code: ErrorCode) {
  return new Error(ERROR_MESSAGES[code])
}

// Replace a message we didn't author (crash, network drop): it could leak internals
export function toErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : null
  return message && ALLOWED_MESSAGES.includes(message) ? message : ERROR_MESSAGES.SERVER
}
