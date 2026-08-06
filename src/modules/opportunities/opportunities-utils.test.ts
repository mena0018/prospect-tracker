import { describe, expect, it } from 'vitest'

import type { Opportunity, Stage } from '@/db/schema'
import {
  toSortColumn,
  formatDailyRate,
  isAboveReference,
  isArchived,
  isDueForFollowUp,
  toRows
} from './opportunities-utils'
import { opportunitiesSearchSchema } from './opportunities-schema'
import { indexStages } from '@/modules/stages/stages-utils'

const TODAY = '2026-07-26'

function makeStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: 'stage-contacted',
    userId: 'user-1',
    name: 'Contacté',
    color: 'blue',
    position: 1,
    reminderDelayDays: 7,
    isArchived: false,
    createdAt: new Date(),
    ...overrides
  }
}

function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 'opp-1',
    userId: 'user-1',
    stageId: 'stage-contacted',
    jobTypeId: null,
    experienceId: null,
    recruiter: 'Thomas Mercier',
    esn: null,
    endClient: null,
    need: null,
    dailyRate: null,
    onsiteDays: null,
    location: null,
    lastContactAt: null,
    nextReminderAt: null,
    phone: null,
    offerUrl: null,
    notes: null,
    isPinned: false,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

describe('the follow-up due date', () => {
  it('falls the stage delay after the last contact', () => {
    const stage = makeStage({ reminderDelayDays: 7 })

    // Due 2026-07-08, so due on the 8th and not yet on the 7th.
    const opportunity = makeOpportunity({ lastContactAt: '2026-07-01' })
    expect(isDueForFollowUp(opportunity, stage, '2026-07-08')).toBe(true)
    expect(isDueForFollowUp(opportunity, stage, '2026-07-07')).toBe(false)
  })

  it('crosses month and year boundaries', () => {
    const stage = makeStage({ reminderDelayDays: 5 })

    expect(
      isDueForFollowUp(makeOpportunity({ lastContactAt: '2026-01-30' }), stage, '2026-02-04')
    ).toBe(true)
    expect(
      isDueForFollowUp(makeOpportunity({ lastContactAt: '2026-01-30' }), stage, '2026-02-03')
    ).toBe(false)
    expect(
      isDueForFollowUp(makeOpportunity({ lastContactAt: '2026-12-30' }), stage, '2027-01-04')
    ).toBe(true)
  })

  it('does not shift across a DST change', () => {
    const stage = makeStage({ reminderDelayDays: 1 })

    expect(
      isDueForFollowUp(makeOpportunity({ lastContactAt: '2026-03-28' }), stage, '2026-03-29')
    ).toBe(true)
    expect(
      isDueForFollowUp(makeOpportunity({ lastContactAt: '2026-03-28' }), stage, '2026-03-28')
    ).toBe(false)
    expect(
      isDueForFollowUp(makeOpportunity({ lastContactAt: '2026-10-24' }), stage, '2026-10-25')
    ).toBe(true)
  })

  it('prefers the user-forced reminder date over the stage delay', () => {
    const stage = makeStage({ reminderDelayDays: 30 })
    const opportunity = makeOpportunity({
      lastContactAt: '2026-07-01',
      nextReminderAt: '2026-07-10'
    })

    expect(isDueForFollowUp(opportunity, stage, '2026-07-10')).toBe(true)
    expect(isDueForFollowUp(opportunity, stage, '2026-07-09')).toBe(false)
  })

  it('never comes due without a starting date', () => {
    expect(isDueForFollowUp(makeOpportunity(), makeStage(), TODAY)).toBe(false)
    expect(isDueForFollowUp(makeOpportunity({ lastContactAt: TODAY }), undefined, TODAY)).toBe(
      false
    )
  })
})

describe('isDueForFollowUp', () => {
  it('is due once the computed date is reached', () => {
    const stage = makeStage({ reminderDelayDays: 7 })

    expect(isDueForFollowUp(makeOpportunity({ lastContactAt: '2026-07-19' }), stage, TODAY)).toBe(
      true
    )
    expect(isDueForFollowUp(makeOpportunity({ lastContactAt: '2026-07-20' }), stage, TODAY)).toBe(
      false
    )
  })

  it('counts a date falling exactly today as due', () => {
    const stage = makeStage({ reminderDelayDays: 0 })
    const opportunity = makeOpportunity({ lastContactAt: TODAY })

    expect(isDueForFollowUp(opportunity, stage, TODAY)).toBe(true)
  })

  it('honours a shorter stage delay', () => {
    const opportunity = makeOpportunity({ lastContactAt: '2026-07-24' })

    expect(isDueForFollowUp(opportunity, makeStage({ reminderDelayDays: 2 }), TODAY)).toBe(true)
    expect(isDueForFollowUp(opportunity, makeStage({ reminderDelayDays: 7 }), TODAY)).toBe(false)
  })

  it('excludes archived opportunities and archived stages', () => {
    const overdue = { lastContactAt: '2026-06-01' }

    expect(isDueForFollowUp(makeOpportunity(overdue), makeStage(), TODAY)).toBe(true)
    expect(
      isDueForFollowUp(makeOpportunity({ ...overdue, isArchived: true }), makeStage(), TODAY)
    ).toBe(false)
    expect(isDueForFollowUp(makeOpportunity(overdue), makeStage({ isArchived: true }), TODAY)).toBe(
      false
    )
  })
})

describe('toRows', () => {
  it('decorates a row with its stage and due flag', () => {
    const stage = makeStage({ id: 's', reminderDelayDays: 0 })
    const stageIndex = indexStages([stage])

    const [dueToday] = toRows(
      [makeOpportunity({ stageId: 's', lastContactAt: TODAY })],
      stageIndex,
      TODAY
    )
    const [notYet] = toRows(
      [makeOpportunity({ stageId: 's', lastContactAt: '2026-07-27' })],
      stageIndex,
      TODAY
    )

    expect(dueToday?.stage).toEqual(stage)
    expect(dueToday?.isDue).toBe(true)
    expect(notYet?.isDue).toBe(false)
  })

  it('leaves the stage undefined when it is missing from the index', () => {
    const [row] = toRows([makeOpportunity({ stageId: 'gone' })], indexStages([]), TODAY)

    expect(row?.stage).toBeUndefined()
    expect(row?.isDue).toBe(false)
  })
})

describe('isArchived', () => {
  it('treats an archived stage as archiving its opportunities', () => {
    expect(isArchived(makeOpportunity(), makeStage())).toBe(false)
    expect(isArchived(makeOpportunity({ isArchived: true }), makeStage())).toBe(true)
    expect(isArchived(makeOpportunity(), makeStage({ isArchived: true }))).toBe(true)
  })
})

describe('the sort search param', () => {
  const parse = (search: Record<string, unknown>) => opportunitiesSearchSchema.parse(search)

  it('keeps a sortable column with an explicit direction', () => {
    expect(parse({ sort: 'dailyRate:desc' }).sort).toBe('dailyRate:desc')
    expect(parse({ sort: 'recruiter:asc' }).sort).toBe('recruiter:asc')
  })

  it('drops a column outside the whitelist', () => {
    expect(parse({ sort: 'notes:desc' }).sort).toBe('')
    expect(parse({ sort: 'id; drop table opportunities:asc' }).sort).toBe('')
  })

  it('drops a malformed direction rather than defaulting it silently', () => {
    expect(parse({ sort: 'recruiter:banana' }).sort).toBe('')
    expect(parse({ sort: 'recruiter' }).sort).toBe('')
  })

  it('falls back instead of throwing on a non-string', () => {
    expect(parse({ sort: 42 }).sort).toBe('')
  })
})

describe('the other search params', () => {
  const parse = (search: Record<string, unknown>) => opportunitiesSearchSchema.parse(search)

  it('falls back on values outside the allowed set', () => {
    expect(parse({ tab: 'nonsense' }).tab).toBe('active')
    expect(parse({ due: 'notabool' }).due).toBe(false)
    expect(parse({ perPage: 999 }).perPage).toBe(8)
    expect(parse({ page: 0 }).page).toBe(1)
  })

  it('applies every default on an empty URL', () => {
    expect(parse({})).toEqual({ tab: 'active', q: '', due: false, sort: '', page: 1, perPage: 8 })
  })
})

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
