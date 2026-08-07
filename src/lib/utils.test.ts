import { describe, expect, it } from 'vitest'

import { asString, cn, formatDate, formatValue } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('dedupes conflicting tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles conditional classes', () => {
    const hidden = false
    expect(cn('base', hidden && 'hidden', 'shown')).toBe('base shown')
  })
})

describe('asString', () => {
  it('returns the value when it is a string', () => {
    expect(asString('hello')).toBe('hello')
    expect(asString('')).toBe('')
  })

  it('returns null for non-strings', () => {
    expect(asString(42)).toBeNull()
    expect(asString(null)).toBeNull()
    expect(asString(undefined)).toBeNull()
    expect(asString({})).toBeNull()
  })
})

describe('formatDate', () => {
  it('formats an ISO date as DD/MM/YYYY', () => {
    expect(formatDate('2026-07-26')).toBe('26/07/2026')
    expect(formatDate('2026-01-01')).toBe('01/01/2026')
  })

  it('does not shift the day across timezones', () => {
    expect(formatDate('2026-03-29')).toBe('29/03/2026')
    expect(formatDate('2026-12-31')).toBe('31/12/2026')
  })

  it('falls back to a dash for missing or malformed dates', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate('2026-07')).toBe('—')
  })
})

describe('formatValue', () => {
  it('renders a value, with an optional suffix', () => {
    expect(formatValue('Paris')).toBe('Paris')
    expect(formatValue(450, ' €')).toBe('450 €')
    expect(formatValue(72, '%')).toBe('72%')
  })

  it('keeps zero, which is a real value rather than an absent one', () => {
    expect(formatValue(0)).toBe('0')
    expect(formatValue(0, '%')).toBe('0%')
  })

  it('falls back to a dash for null and undefined', () => {
    expect(formatValue(null)).toBe('—')
    expect(formatValue(undefined)).toBe('—')
    expect(formatValue(null, ' €')).toBe('—')
  })
})
