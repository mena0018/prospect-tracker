import { describe, expect, it } from 'vitest'

import { toColumns } from '@/modules/opportunities/utils/board'
import { makeRow, makeStage } from '@/modules/opportunities/utils/opportunity-fixture'

const contacted = makeStage({ id: 'stage-a', name: 'Contacté', position: 0 })
const interview = makeStage({ id: 'stage-b', name: 'Entretien', position: 1 })
const parked = makeStage({ id: 'stage-c', name: 'Rangé', position: 2, isArchived: true })

describe('toColumns', () => {
  it('gives every active stage a column, in pipeline order', () => {
    const columns = toColumns([], [contacted, interview])

    expect(columns.map((column) => column.stage.id)).toEqual(['stage-a', 'stage-b'])
  })

  it('keeps an empty column rather than dropping it', () => {
    const columns = toColumns([makeRow({ stageId: 'stage-a' })], [contacted, interview])

    expect(columns[1]?.cards).toEqual([])
  })

  it('leaves archived stages out of the board', () => {
    const columns = toColumns([], [contacted, parked])

    expect(columns.map((column) => column.stage.id)).toEqual(['stage-a'])
  })

  it('groups each row under its own stage', () => {
    const columns = toColumns(
      [
        makeRow({ id: 'opp-1', stageId: 'stage-b' }),
        makeRow({ id: 'opp-2', stageId: 'stage-a' }),
        makeRow({ id: 'opp-3', stageId: 'stage-b' })
      ],
      [contacted, interview]
    )

    expect(columns[0]?.cards.map((card) => card.id)).toEqual(['opp-2'])
    expect(columns[1]?.cards.map((card) => card.id)).toEqual(['opp-1', 'opp-3'])
  })

  it('preserves the order the rows arrive in, which is pinned first', () => {
    const columns = toColumns(
      [
        makeRow({ id: 'pinned', stageId: 'stage-a', isPinned: true }),
        makeRow({ id: 'plain', stageId: 'stage-a' })
      ],
      [contacted]
    )

    expect(columns[0]?.cards.map((card) => card.id)).toEqual(['pinned', 'plain'])
  })

  it('drops a row whose stage is archived, since that column is gone', () => {
    const columns = toColumns([makeRow({ stageId: 'stage-c' })], [contacted, parked])

    expect(columns[0]?.cards).toEqual([])
  })
})
