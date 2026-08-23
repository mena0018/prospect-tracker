import { describe, expect, it } from 'vitest'

import { moveInList, moveToEdge } from '@/shared/sortable/sortable-utils'

const items = ['a', 'b', 'c', 'd']

// The announcer names the row its caller passed rather than deducing it, so what needs proving is
// that the caller can always name it: the id it acted on survives the move it just computed.
describe('the moved row stays identifiable after a move', () => {
  it('keeps the moved id present after a neighbour swap', () => {
    const moved = items[2]!

    expect(moveInList(items, 2, -1).indexOf(moved)).toBe(1)
  })

  it('keeps the moved id present after a lift to either edge', () => {
    const moved = items[2]!

    expect(moveToEdge(items, 2, 'top').indexOf(moved)).toBe(0)
    expect(moveToEdge(items, 2, 'bottom').indexOf(moved)).toBe(3)
  })

  it('reports the right 1-based position for the announcement', () => {
    const moved = items[0]!

    expect(moveToEdge(items, 0, 'bottom').indexOf(moved) + 1).toBe(4)
  })
})
