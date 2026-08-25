import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isServer() {
  return typeof window === 'undefined'
}

export function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export function formatDate(isoDate: string | null) {
  if (!isoDate) return '—'

  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return '—'

  return `${day}/${month}/${year}`
}

export function formatValue(value: string | number | null | undefined, suffix = '') {
  return value == null ? '—' : `${value}${suffix}`
}
