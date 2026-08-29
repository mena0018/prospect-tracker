import { describe, expect, it } from 'vitest'

import { m } from '@/i18n/paraglide/messages'
import {
  contactFormSchema,
  createContactSchema,
  isIdentified,
  setOpportunityContactsSchema,
  updateContactSchema
} from './contacts-schema'
import { toContactFormValues } from './utils/form-values'

const parse = (overrides: Partial<ReturnType<typeof toContactFormValues>> = {}) =>
  contactFormSchema.safeParse({
    ...toContactFormValues(null),
    lastName: 'Vasseur',
    ...overrides
  })

describe('contactFormSchema', () => {
  it('turns blank strings into null', () => {
    const result = parse()

    expect(result.success).toBe(true)
    expect(result.data?.company).toBeNull()
    expect(result.data?.city).toBeNull()
  })

  it('drops the empty row the form always renders', () => {
    const result = parse({ emails: [''], phones: ['  '] })

    expect(result.success).toBe(true)
    expect(result.data?.emails).toEqual([])
    expect(result.data?.phones).toEqual([])
  })

  it('keeps several emails and phones', () => {
    const result = parse({
      emails: ['a@alten.fr', 'b@alten.fr'],
      phones: ['+33 6 12 34 56 78', '0320123456']
    })

    expect(result.success).toBe(true)
    expect(result.data?.emails).toEqual(['a@alten.fr', 'b@alten.fr'])
    expect(result.data?.phones).toEqual(['+33 6 12 34 56 78', '0320123456'])
  })

  it('rejects a malformed email among valid ones', () => {
    const result = parse({ emails: ['a@alten.fr', 'not-an-email'] })

    expect(result.success).toBe(false)
  })

  it('requires a name or a company — the check constraint, surfaced as a field error', () => {
    const result = parse({ firstName: '', lastName: '', company: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      m.validation_contactIdentityRequired()
    )
  })

  it('accepts a company with no person attached', () => {
    const result = parse({ firstName: '', lastName: '', company: 'Alten' })

    expect(result.success).toBe(true)
  })
})

describe('updateContactSchema', () => {
  const id = '22222222-2222-4222-8222-222222222222'

  it('accepts a patch that touches no name at all', () => {
    const result = updateContactSchema.safeParse({ id, city: 'Lille' })

    expect(result.success).toBe(true)
  })

  // Identity is no longer decided here: the patch alone cannot tell whether the stored row keeps
  // a name. `isIdentified` carries the rule, and the server applies it to the merged row.
  it('leaves the identity rule to the server, even when the patch blanks all three', () => {
    const result = updateContactSchema.safeParse({
      id,
      firstName: null,
      lastName: null,
      company: null
    })

    expect(result.success).toBe(true)
  })

  it('accepts a patch that keeps one name', () => {
    const result = updateContactSchema.safeParse({ id, firstName: null, lastName: 'Vasseur' })

    expect(result.success).toBe(true)
  })

  // The patch goes straight into the UPDATE, so a defaulted key would wipe stored reachability.
  it('omits absent keys instead of defaulting them', () => {
    const result = updateContactSchema.parse({ id })

    expect(result).toEqual({ id })
  })

  it('keeps explicitly sent list values', () => {
    const result = updateContactSchema.parse({ id, emails: ['t@v.co'], relationship: 'end_client' })

    expect(result).toMatchObject({ emails: ['t@v.co'], relationship: 'end_client' })
  })

  it('still rejects an invalid email inside a patch', () => {
    expect(updateContactSchema.safeParse({ id, emails: ['nope'] }).success).toBe(false)
  })

  it('defaults the lists on create, where the row is new', () => {
    const result = createContactSchema.parse({ lastName: 'Vasseur' })

    expect(result).toMatchObject({ emails: [], phones: [], relationship: 'other' })
  })

  // The stored row may still carry a name the patch says nothing about, so the identity rule
  // cannot live here — the server applies it to the merged row instead.
  it('accepts blanking one name, since the others are unknown at this point', () => {
    expect(updateContactSchema.safeParse({ id, firstName: null }).success).toBe(true)
  })
})

// What the server checks after merging the patch into the stored row.
describe('isIdentified', () => {
  it('accepts a row keeping any one of the three', () => {
    expect(isIdentified({ firstName: null, lastName: 'Vasseur', company: null })).toBe(true)
    expect(isIdentified({ firstName: null, lastName: null, company: 'Astek' })).toBe(true)
  })

  it('rejects a row that has none of them', () => {
    expect(isIdentified({ firstName: null, lastName: null, company: null })).toBe(false)
  })

  // The merge is what makes a blanking patch safe or not.
  it('is decided on the merged row, not the patch', () => {
    const stored = { firstName: 'Thomas', lastName: 'Vasseur', company: null }

    expect(isIdentified({ ...stored, firstName: null })).toBe(true)
    expect(isIdentified({ ...stored, firstName: null, lastName: null })).toBe(false)
  })
})

describe('setOpportunityContactsSchema', () => {
  const opportunityId = '11111111-1111-4111-8111-111111111111'
  const first = '22222222-2222-4222-8222-222222222222'
  const second = '33333333-3333-4333-8333-333333333333'

  it('accepts a list of distinct contacts', () => {
    const result = setOpportunityContactsSchema.safeParse({
      opportunityId,
      contactIds: [first, second]
    })

    expect(result.success).toBe(true)
  })

  // Same id twice collides on the join table's primary key: a field error, not a 500.
  it('rejects the same contact twice', () => {
    const result = setOpportunityContactsSchema.safeParse({
      opportunityId,
      contactIds: [first, first]
    })

    expect(result.success).toBe(false)
  })
})
