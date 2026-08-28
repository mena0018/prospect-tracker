import { z } from 'zod/v4'

import { CONTACT_RELATIONSHIPS } from '@/db/schema'
import { m } from '@/i18n/paraglide/messages'
import { toOptionalText } from '@/modules/opportunities/utils/form-values'
import { tableSearchSchema } from '@/shared/table/table-schema'

// See docs/reference/data-model.md for the nullable + optional rule
const nullableText = z.string().trim().nullable().optional()

export const CONTACT_NOTES_MAX_LENGTH = 500

// Reachability is stored as arrays — see docs/reference/contacts.md
export const MAX_EMAILS = 5
export const MAX_PHONES = 5

const emailList = z
  .array(z.email({ error: () => m.validation_emailInvalid() }).trim())
  .max(MAX_EMAILS)
  .default([])

const phoneList = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(30, { error: () => m.validation_phoneTooLong() })
  )
  .max(MAX_PHONES)
  .default([])

const contactFields = z.object({
  firstName: nullableText,
  lastName: nullableText,
  company: nullableText,
  jobTitle: nullableText,
  city: nullableText,
  emails: emailList,
  phones: phoneList,
  linkedinUrl: z
    .url({ error: () => m.validation_linkedinInvalid() })
    .nullable()
    .optional(),
  relationship: z.enum(CONTACT_RELATIONSHIPS).default('other'),
  notes: z
    .string()
    .trim()
    .max(CONTACT_NOTES_MAX_LENGTH, { error: () => m.validation_notesTooLong() })
    .nullable()
    .optional()
})

// Mirrors the `contacts_identified` check constraint: a contact with none of the three is
// unaddressable, and the DB would reject it anyway — better as a field error than a 500.
const isIdentified = (values: {
  firstName?: string | null
  lastName?: string | null
  company?: string | null
}) => Boolean(values.firstName || values.lastName || values.company)

const IDENTITY_ERROR = {
  error: () => m.validation_contactIdentityRequired(),
  path: ['lastName' as const]
}

export const contactFieldsSchema = contactFields.refine(isIdentified, IDENTITY_ERROR)

// Every field is a string; the schema below converts back at the edge, same as the
// opportunity form — see docs/reference/opportunity-form.md
export type ContactFormValues = {
  firstName: string
  lastName: string
  company: string
  jobTitle: string
  city: string
  emails: string[]
  phones: string[]
  linkedinUrl: string
  relationship: string
  notes: string
}

const TEXT_FIELDS = [
  'firstName',
  'lastName',
  'company',
  'jobTitle',
  'city',
  'linkedinUrl',
  'notes'
] as const
const LIST_FIELDS = ['emails', 'phones'] as const

// `z.custom` rather than a piped object schema — the variance check rejects the wider server
// input type. See docs/reference/opportunity-form.md
export const contactFormSchema = z
  .custom<ContactFormValues>()
  .transform((raw) => {
    const values: Record<string, unknown> = { ...raw }

    for (const key of TEXT_FIELDS) values[key] = toOptionalText(values[key])
    // A blank row the user added and left empty is not a validation error, it is nothing.
    for (const key of LIST_FIELDS) {
      const list = values[key]
      values[key] = Array.isArray(list)
        ? list.map((entry) => (typeof entry === 'string' ? entry.trim() : entry)).filter(Boolean)
        : []
    }

    return values
  })
  .pipe(contactFieldsSchema)

export const createContactSchema = contactFieldsSchema

// A patch may omit every name, but it must not blank out all three at once.
export const updateContactSchema = z
  .object({ id: z.uuid(), ...contactFields.partial().shape })
  .refine(
    (values) =>
      values.firstName === undefined &&
      values.lastName === undefined &&
      values.company === undefined
        ? true
        : isIdentified(values),
    IDENTITY_ERROR
  )

export const deleteContactSchema = z.object({ id: z.uuid() })

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>

export const CONTACTS_PAGE_SIZES: readonly number[] = [10, 15, 25] as const

// Whitelist, not a hint: the value reaches an ORDER BY.
export const CONTACT_SORT_COLUMNS = [
  'name',
  'company',
  'relationship',
  'lastExchange',
  'opportunities'
] as const

export type ContactSortColumn = (typeof CONTACT_SORT_COLUMNS)[number]

export const CONTACTS_SEARCH_DEFAULTS = {
  q: '',
  relationship: '' as const,
  sort: '',
  page: 1,
  perPage: 10
}

export const contactsSearchSchema = z.object({
  q: z.string().catch(CONTACTS_SEARCH_DEFAULTS.q),
  // '' is "every relationship", so the filter chip has an off state the URL can drop.
  relationship: z.enum(['', ...CONTACT_RELATIONSHIPS]).catch(CONTACTS_SEARCH_DEFAULTS.relationship),
  ...tableSearchSchema({
    sortColumns: CONTACT_SORT_COLUMNS,
    pageSizes: CONTACTS_PAGE_SIZES,
    defaultPerPage: CONTACTS_SEARCH_DEFAULTS.perPage
  }).shape
})

export type ContactsSearch = z.infer<typeof contactsSearchSchema>

// Same cap as the opportunities search, and for the same reason: every term becomes its own
// OR-group, so the length cap bounds the generated SQL.
const searchQuery = z.string().trim().max(200)

export const getContactsSchema = z.object({
  q: searchQuery,
  relationship: z.enum(['', ...CONTACT_RELATIONSHIPS]),
  sortBy: z.enum(CONTACT_SORT_COLUMNS).nullable(),
  sortDesc: z.boolean(),
  page: z.int().min(1),
  perPage: z.int().refine((size) => CONTACTS_PAGE_SIZES.includes(size))
})

export type GetContactsInput = z.infer<typeof getContactsSchema>

export const contactDetailSchema = z.object({ id: z.uuid() })

// Linking ---------------------------------------------------------------------

export const linkContactSchema = z.object({
  opportunityId: z.uuid(),
  contactId: z.uuid()
})

export const unlinkContactSchema = linkContactSchema

// The whole list in one write: reordering and unlinking are the same operation to the server.
export const setOpportunityContactsSchema = z.object({
  opportunityId: z.uuid(),
  contactIds: z.array(z.uuid()).max(20)
})

export type SetOpportunityContactsInput = z.infer<typeof setOpportunityContactsSchema>

// A search that returns few rows and no pagination — the link picker is a keystroke away.
export const searchContactsSchema = z.object({
  q: searchQuery,
  limit: z.int().min(1).max(20).default(8)
})
