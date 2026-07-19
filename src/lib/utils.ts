import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export function toInitials(name: string) {
  const [first = '', second = ''] = name.split(/\s+/).filter(Boolean)
  return ((first[0] ?? '') + (second[0] ?? first[1] ?? '')).toUpperCase()
}
