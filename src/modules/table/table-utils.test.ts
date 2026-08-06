import { describe, expect, it } from 'vitest'

import {
  fromPaginationState,
  parseSort,
  serializeSort,
  toPaginationState
} from '@/modules/table/table-utils'

describe('parseSort', () => {
  it('maps a normalised value to the table sorting state', () => {
    expect(parseSort('dailyRate:desc')).toEqual([{ id: 'dailyRate', desc: true }])
    expect(parseSort('recruiter:asc')).toEqual([{ id: 'recruiter', desc: false }])
    expect(parseSort('')).toEqual([])
  })

  it('treats anything that is not `desc` as ascending', () => {
    expect(parseSort('recruiter')).toEqual([{ id: 'recruiter', desc: false }])
    expect(parseSort('recruiter:sideways')).toEqual([{ id: 'recruiter', desc: false }])
  })
})

describe('serializeSort', () => {
  it('round-trips through parseSort', () => {
    for (const value of ['dailyRate:desc', 'recruiter:asc', '']) {
      expect(serializeSort(parseSort(value))).toBe(value)
    }
  })

  it('keeps only the first entry, since one column sorts at a time', () => {
    expect(
      serializeSort([
        { id: 'esn', desc: true },
        { id: 'recruiter', desc: false }
      ])
    ).toBe('esn:desc')
  })
})

describe('pagination conversion', () => {
  it('shifts between the 1-based URL and the 0-based table', () => {
    expect(toPaginationState(1, 8)).toEqual({ pageIndex: 0, pageSize: 8 })
    expect(toPaginationState(3, 15)).toEqual({ pageIndex: 2, pageSize: 15 })
  })

  it('round-trips', () => {
    expect(fromPaginationState(toPaginationState(4, 10))).toEqual({ page: 4, perPage: 10 })
  })
})
