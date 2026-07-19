import { describe, expect, it } from 'vitest'

import { asString, cn, toInitials } from './utils'

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

describe('toInitials', () => {
  it('takes the first letter of the two first words', () => {
    expect(toInitials('Rabie Menad')).toBe('RM')
    expect(toInitials('Jean Dupont')).toBe('JD')
    expect(toInitials('Marie Claire Dubois')).toBe('MC')
  })

  it('falls back to the two first letters of a single word', () => {
    expect(toInitials('Cher')).toBe('CH')
    expect(toInitials('john-doe')).toBe('JO')
  })

  it('ignores extra whitespace', () => {
    expect(toInitials('  Marie   Curie  ')).toBe('MC')
    expect(toInitials('\tAda\nLovelace ')).toBe('AL')
  })

  it('handles too-short input', () => {
    expect(toInitials('X')).toBe('X')
    expect(toInitials('')).toBe('')
    expect(toInitials('   ')).toBe('')
  })
})
