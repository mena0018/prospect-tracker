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
