import { describe, expect, it } from 'vitest'

import { NOTES_MAX_LENGTH } from '@/modules/opportunities/opportunities-schema'
import {
  formatDailyRate,
  isAboveReference,
  notesRemaining,
  notesRemainingTone,
  toSortColumn
} from './display'

describe('formatDailyRate', () => {
  it('appends the currency and falls back to a dash', () => {
    expect(formatDailyRate(480)).toBe('480 €')
    expect(formatDailyRate(0)).toBe('0 €')
    expect(formatDailyRate(null)).toBe('—')
  })
})

describe('isAboveReference', () => {
  it('counts a rate equal to the reference as above', () => {
    expect(isAboveReference(450, 450)).toBe(true)
    expect(isAboveReference(451, 450)).toBe(true)
    expect(isAboveReference(449, 450)).toBe(false)
    expect(isAboveReference(null, 450)).toBe(false)
  })
})

describe('toSortColumn', () => {
  it('accepts a sortable column', () => {
    expect(toSortColumn('dailyRate')).toBe('dailyRate')
    expect(toSortColumn('stage')).toBe('stage')
  })

  it('rejects anything outside the whitelist', () => {
    expect(toSortColumn('notes')).toBeNull()
    expect(toSortColumn('id; drop table opportunities')).toBeNull()
    expect(toSortColumn('')).toBeNull()
  })
})

describe('notesRemainingTone', () => {
  const warningAt = NOTES_MAX_LENGTH * 0.2
  const dangerAt = NOTES_MAX_LENGTH * 0.05

  it('counts against the limit', () => {
    expect(notesRemaining('')).toBe(NOTES_MAX_LENGTH)
    expect(notesRemaining('abc')).toBe(NOTES_MAX_LENGTH - 3)
  })

  it('stays neutral while there is room', () => {
    expect(notesRemainingTone(NOTES_MAX_LENGTH)).toBeUndefined()
    expect(notesRemainingTone(warningAt + 1)).toBeUndefined()
  })

  it('warns from a fifth left down to the danger step', () => {
    expect(notesRemainingTone(warningAt)).toBe('text-warning')
    expect(notesRemainingTone(dangerAt + 1)).toBe('text-warning')
  })

  it('turns destructive at the danger step and at the limit', () => {
    expect(notesRemainingTone(dangerAt)).toBe('text-destructive')
    expect(notesRemainingTone(0)).toBe('text-destructive')
  })
})
