import { describe, expect, it } from 'vitest'

import { STAGE_COLOR_TOKENS, type Stage } from '@/db/schema'
import { followUpProgress, indexStages, justClearedQueue, stageColorVar } from './stages-utils'

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

describe('indexStages', () => {
  it('looks a stage up by id', () => {
    const contacted = makeStage()
    const interview = makeStage({ id: 'stage-interview', name: 'Entretien', position: 3 })

    const index = indexStages([contacted, interview])

    expect(index.get('stage-interview')).toBe(interview)
    expect(index.size).toBe(2)
  })

  it('returns undefined for a stage that is not in the list', () => {
    expect(indexStages([makeStage()]).get('stage-deleted')).toBeUndefined()
  })

  it('has no entries for an empty list', () => {
    expect(indexStages([]).size).toBe(0)
  })
})

describe('stageColorVar', () => {
  it('builds the CSS variable for every token of the palette', () => {
    for (const token of STAGE_COLOR_TOKENS) {
      expect(stageColorVar(token)).toBe(`var(--stage-${token})`)
    }
  })

  // Only a DB CHECK guards the column, so an unknown value must not reach the CSS variable.
  it('falls back to slate on an unknown token', () => {
    expect(stageColorVar('chartreuse')).toBe('var(--stage-slate)')
    expect(stageColorVar('')).toBe('var(--stage-slate)')
  })

  it('does not interpolate a value that could escape the variable name', () => {
    expect(stageColorVar('teal); background: url(evil')).toBe('var(--stage-slate)')
  })
})

describe('followUpProgress', () => {
  it('is undefined until both counts have loaded', () => {
    expect(followUpProgress(undefined, undefined)).toBeUndefined()
    expect(followUpProgress(3, undefined)).toBeUndefined()
    expect(followUpProgress(undefined, 3)).toBeUndefined()
  })

  it('totals the rows still due with those already contacted today', () => {
    expect(followUpProgress(16, 0)).toMatchObject({ done: 0, total: 16, percent: 0 })
    expect(followUpProgress(10, 6)).toMatchObject({ done: 6, total: 16, percent: 38 })
  })

  // The total is what keeps the bar from sliding: a follow-up moves one row across it.
  it('holds the total steady as rows move from due to done', () => {
    const before = followUpProgress(16, 0)
    const after = followUpProgress(15, 1)

    expect(after?.total).toBe(before?.total)
    expect(after?.done).toBe(1)
  })

  it('completes once nothing is left due', () => {
    expect(followUpProgress(0, 16)).toMatchObject({ percent: 100, isComplete: true })
  })

  it('treats a day with no follow-ups at all as complete, not as a division by zero', () => {
    expect(followUpProgress(0, 0)).toMatchObject({ total: 0, percent: 100, isComplete: true })
  })

  it('is incomplete while any row is still due', () => {
    expect(followUpProgress(1, 15)?.isComplete).toBe(false)
  })

  // A quiet day and a cleared day both end at 100%, but only the cleared one had work in it —
  // that is what tells the celebration apart from the calm card.
  it('separates a quiet day from a cleared one by its total', () => {
    expect(followUpProgress(0, 0)?.total).toBe(0)
    expect(followUpProgress(0, 4)?.total).toBe(4)
  })
})

describe('justClearedQueue', () => {
  it('fires when the last due row is cleared', () => {
    expect(justClearedQueue(1, 0)).toBe(true)
    expect(justClearedQueue(16, 0)).toBe(true)
  })

  // The bug this exists to prevent: creating an up-to-date opportunity took the count from
  // undefined/0 to 0 and celebrated a queue the user never worked through.
  it('stays silent when the queue was never non-empty', () => {
    expect(justClearedQueue(undefined, 0)).toBe(false)
    expect(justClearedQueue(0, 0)).toBe(false)
  })

  it('stays silent while rows are still due', () => {
    expect(justClearedQueue(5, 3)).toBe(false)
    expect(justClearedQueue(0, 2)).toBe(false)
  })

  it('stays silent until the counts have loaded', () => {
    expect(justClearedQueue(undefined, undefined)).toBe(false)
    expect(justClearedQueue(3, undefined)).toBe(false)
  })
})
