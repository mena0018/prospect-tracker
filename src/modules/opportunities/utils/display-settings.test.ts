import { describe, expect, it } from 'vitest'

import {
  isView,
  parseHiddenColumns,
  serializeHiddenColumns,
  toggleHiddenColumn
} from '@/modules/opportunities/utils/display-settings'

describe('isView', () => {
  it('accepts the two views and nothing else', () => {
    expect(isView('list')).toBe(true)
    expect(isView('kanban')).toBe(true)
    expect(isView('gallery')).toBe(false)
  })
})

describe('parseHiddenColumns', () => {
  it('drops anything that is not a hidable column', () => {
    expect(parseHiddenColumns('esn,recruiter,nonsense,location')).toEqual(['esn', 'location'])
  })

  it('reads an empty string as nothing hidden', () => {
    expect(parseHiddenColumns('')).toEqual([])
  })
})

describe('serializeHiddenColumns', () => {
  // Canonical order, so two ways of hiding the same pair produce one URL.
  it('writes the columns in their declared order', () => {
    expect(serializeHiddenColumns(['location', 'esn'])).toBe('esn,location')
  })

  it('writes nothing when no column is hidden', () => {
    expect(serializeHiddenColumns([])).toBe('')
  })
})

describe('toggleHiddenColumn', () => {
  it('hides a visible column', () => {
    expect(toggleHiddenColumn([], 'esn')).toEqual(['esn'])
  })

  it('shows a hidden one again', () => {
    expect(toggleHiddenColumn(['esn', 'location'], 'esn')).toEqual(['location'])
  })
})
