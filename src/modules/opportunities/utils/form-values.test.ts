import { describe, expect, it } from 'vitest'

import { FIXTURE_STAGE_ID, makeRow } from './opportunity-fixture'
import { toFormValues } from './form-values'

describe('toFormValues', () => {
  it('falls back to the given stage when creating', () => {
    const values = toFormValues(null, FIXTURE_STAGE_ID)

    expect(values.stageId).toBe(FIXTURE_STAGE_ID)
    expect(values.recruiter).toBe('')
    expect(values.dailyRate).toBe('')
  })

  it('renders nulls as empty strings so inputs stay controlled', () => {
    const values = toFormValues(makeRow(), FIXTURE_STAGE_ID)

    expect(values.esn).toBe('')
    expect(values.dailyRate).toBe('')
    expect(values.jobTypeId).toBeNull()
  })

  it('defaults the last contact date to today when creating', () => {
    const values = toFormValues(null, FIXTURE_STAGE_ID, '2026-08-15')

    expect(values.lastContactAt).toBe('2026-08-15')
  })

  it('keeps the stored last contact date when editing', () => {
    const values = toFormValues(
      makeRow({ lastContactAt: '2026-01-09' }),
      FIXTURE_STAGE_ID,
      '2026-08-15'
    )

    expect(values.lastContactAt).toBe('2026-01-09')
  })

  it('leaves an edited row without a contact date empty', () => {
    const values = toFormValues(makeRow(), FIXTURE_STAGE_ID, '2026-08-15')

    expect(values.lastContactAt).toBe('')
  })

  it('stringifies numbers so they can be typed back', () => {
    const values = toFormValues(makeRow({ dailyRate: 650, onsiteDays: 0 }), FIXTURE_STAGE_ID)

    expect(values.dailyRate).toBe('650')
    expect(values.onsiteDays).toBe('0')
  })
})
