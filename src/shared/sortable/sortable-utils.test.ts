import { describe, expect, it } from 'vitest'

import { moveInList, moveToEdge, nextPosition } from '@/shared/sortable/sortable-utils'

describe('moveInList', () => {
  const list = ['a', 'b', 'c']

  it('swaps an item with its neighbour', () => {
    expect(moveInList(list, 1, -1)).toEqual(['b', 'a', 'c'])
    expect(moveInList(list, 1, 1)).toEqual(['a', 'c', 'b'])
  })

  it('leaves the list untouched at either edge', () => {
    expect(moveInList(list, 0, -1)).toEqual(list)
    expect(moveInList(list, 2, 1)).toEqual(list)
  })

  it('never mutates the input', () => {
    const original = [...list]
    moveInList(list, 0, 1)

    expect(list).toEqual(original)
  })
})

describe('moveToEdge', () => {
  const list = ['a', 'b', 'c', 'd']

  it('lifts an item to the top, keeping the others in order', () => {
    expect(moveToEdge(list, 2, 'top')).toEqual(['c', 'a', 'b', 'd'])
  })

  it('drops an item to the bottom, keeping the others in order', () => {
    expect(moveToEdge(list, 1, 'bottom')).toEqual(['a', 'c', 'd', 'b'])
  })

  it('leaves the list alone when the item is already at that edge', () => {
    expect(moveToEdge(list, 0, 'top')).toEqual(list)
    expect(moveToEdge(list, 3, 'bottom')).toEqual(list)
  })

  it('returns a copy for an out-of-range index', () => {
    expect(moveToEdge(list, 9, 'top')).toEqual(list)
  })
})

describe('nextPosition', () => {
  it('lands after the highest position, not the count', () => {
    // Positions carry gaps once rows are deleted; counting would collide with an existing row.
    expect(nextPosition([{ position: 0 }, { position: 5 }, { position: 2 }])).toBe(6)
  })

  it('starts at 0 on an empty list', () => {
    expect(nextPosition([])).toBe(0)
  })
})
