import { describe, expect, it } from 'vitest'

import { STAGE_COLOR_TOKENS, type Stage } from '@/db/schema'
import { indexStages, stageColorVar } from './stages-utils'

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
