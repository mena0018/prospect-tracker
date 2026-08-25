import { describe, expect, it } from 'vitest'

import { toDisplayName, toInitials, toProfileSubtitle } from '@/modules/auth/utils/profile'

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

describe('toProfileSubtitle', () => {
  const email = 'john-doe@gmail.com'

  it('prefers the job title', () => {
    expect(toProfileSubtitle('Fullstack developer', email)).toBe('Fullstack developer')
  })

  it('trims surrounding whitespace', () => {
    expect(toProfileSubtitle('  Data analyst  ', email)).toBe('Data analyst')
  })

  it('falls back to the email when there is no job title', () => {
    expect(toProfileSubtitle(null, email)).toBe(email)
    expect(toProfileSubtitle('', email)).toBe(email)
    expect(toProfileSubtitle('   ', email)).toBe(email)
  })
})
