import { describe, expect, it } from 'vitest'

import { makeContact, makeLinkedContact } from '@/modules/opportunities/utils/opportunity-fixture'
import {
  contactDisplayName,
  contactInitials,
  primaryContact,
  toRelationshipFilter
} from './display'

describe('contactDisplayName', () => {
  it('joins the first and last name', () => {
    expect(contactDisplayName(makeContact({ firstName: 'Thomas', lastName: 'Vasseur' }))).toBe(
      'Thomas Vasseur'
    )
  })

  it('falls back to the company when no name is stored', () => {
    const contact = makeContact({ firstName: null, lastName: null, company: 'Alten' })

    expect(contactDisplayName(contact)).toBe('Alten')
  })

  it('reads a single-word name — what the recruiter migration produces', () => {
    const contact = makeContact({ firstName: null, lastName: 'Vanessa' })

    expect(contactDisplayName(contact)).toBe('Vanessa')
  })
})

describe('contactInitials', () => {
  it('takes one letter per name part', () => {
    expect(contactInitials(makeContact({ firstName: 'Thomas', lastName: 'Vasseur' }))).toBe('TV')
  })

  it('falls back to the company words', () => {
    const contact = makeContact({ firstName: null, lastName: null, company: 'Sopra Steria' })

    expect(contactInitials(contact)).toBe('SS')
  })
})

describe('primaryContact', () => {
  it('is the first of the list — the contact who pitched', () => {
    const first = makeLinkedContact({ id: 'a' })
    const second = makeLinkedContact({ id: 'b' })

    expect(primaryContact([first, second])).toBe(first)
  })

  it('is null when nothing is linked', () => {
    expect(primaryContact([])).toBeNull()
  })
})

describe('toRelationshipFilter', () => {
  it('keeps a known relationship', () => {
    expect(toRelationshipFilter('esn_manager')).toBe('esn_manager')
  })

  it('reads anything else as the unfiltered state', () => {
    for (const value of ['', 'nonsense', null]) {
      expect(toRelationshipFilter(value)).toBe('')
    }
  })
})
