import { describe, expect, it } from 'vitest'

import { clampDelay, shouldCommit } from './customization-utils'

describe('shouldCommit', () => {
  it('sends a draft that differs from the server value', () => {
    expect(shouldCommit('Entretien tech', 'Entretien')).toBe(true)
  })

  it('skips a draft equal to the server value, ignoring surrounding space', () => {
    expect(shouldCommit('Entretien', 'Entretien')).toBe(false)
    expect(shouldCommit('  Entretien  ', 'Entretien')).toBe(false)
  })

  it('never sends an empty draft', () => {
    expect(shouldCommit('', 'Entretien')).toBe(false)
    expect(shouldCommit('   ', 'Entretien')).toBe(false)
  })

  // The regression: comparing against a locally committed value rather than the server's leaves
  // the field stuck on an optimistic value the server never accepted.
  it('still sends when the server value moved away from an earlier local edit', () => {
    expect(shouldCommit('7', '2')).toBe(true)
  })
})

describe('clampDelay', () => {
  it('clamps into range and rounds', () => {
    expect(clampDelay('120', 0, 90)).toBe(90)
    expect(clampDelay('-5', 0, 90)).toBe(0)
    expect(clampDelay('3.6', 0, 90)).toBe(4)
  })

  it('returns null for a value that is not a number', () => {
    expect(clampDelay('', 0, 90)).toBeNull()
    expect(clampDelay('abc', 0, 90)).toBeNull()
  })
})
