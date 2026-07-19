import { describe, expect, it } from 'vitest'

import { asString, cn, toDisplayName, toInitials } from './utils'

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

describe('toDisplayName', () => {
  it('takes the first name and the initial of the second name', () => {
    expect(toDisplayName('Rabie Menad')).toBe('Rabie. M')
    expect(toDisplayName('Jean Dupont')).toBe('Jean. D')
    expect(toDisplayName('Marie Claire Dubois')).toBe('Marie. C')
  })

  it('falls back to the first name if there is no second name', () => {
    expect(toDisplayName('Cher')).toBe('Cher.')
    expect(toDisplayName('john-doe')).toBe('john-doe.')
  })

  it('ignores extra whitespace', () => {
    expect(toDisplayName('  Marie   Curie  ')).toBe('Marie. C')
    expect(toDisplayName('\tAda\nLovelace ')).toBe('Ada. L')
  })

  it('handles too-short input', () => {
    expect(toDisplayName('X')).toBe('X.')
    expect(toDisplayName('   ')).toBe('.')
  })

  it('falls back to N/C when there is no name', () => {
    expect(toDisplayName(null)).toBe('N/C')
    expect(toDisplayName('')).toBe('N/C')
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
    expect(toInitials('   ')).toBe('')
  })

  it('falls back to N/C when there is no name', () => {
    expect(toInitials(null)).toBe('N/C')
    expect(toInitials('')).toBe('N/C')
  })
})
