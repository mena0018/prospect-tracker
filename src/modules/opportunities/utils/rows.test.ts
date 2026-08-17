import { describe, expect, it } from 'vitest'

import { toRows } from './rows'
import { makeRow, makeStage } from './opportunity-fixture'
import { indexStages } from '@/modules/stages/stages-utils'

describe('toRows', () => {
  it('attaches each row its stage', () => {
    const stage = makeStage({ id: 's' })

    const [row] = toRows([makeRow({ stageId: 's' })], indexStages([stage]))

    expect(row?.stage).toEqual(stage)
  })

  it('leaves the stage undefined when it is missing from the index', () => {
    const [row] = toRows([makeRow({ stageId: 'gone' })], indexStages([]))

    expect(row?.stage).toBeUndefined()
  })

  // The flags come from SQL; toRows must pass them through untouched.
  it('preserves the server-computed flags', () => {
    const [row] = toRows([makeRow({ isDue: true, isArchivedRow: true })], indexStages([]))

    expect(row?.isDue).toBe(true)
    expect(row?.isArchivedRow).toBe(true)
  })
})
