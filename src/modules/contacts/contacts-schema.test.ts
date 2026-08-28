import { describe, expect, it } from 'vitest'

import { m } from '@/i18n/paraglide/messages'
import { contactFormSchema, updateContactSchema } from './contacts-schema'
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

  it('rejects a patch blanking every name at once', () => {
    const result = updateContactSchema.safeParse({
      id,
      firstName: null,
      lastName: null,
      company: null
    })

    expect(result.success).toBe(false)
  })

  it('accepts a patch that keeps one name', () => {
    const result = updateContactSchema.safeParse({ id, firstName: null, lastName: 'Vasseur' })

    expect(result.success).toBe(true)
  })
})
