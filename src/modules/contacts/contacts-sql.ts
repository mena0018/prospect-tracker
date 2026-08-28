import { and, eq, or, sql, type SQL } from 'drizzle-orm'

import { contacts, opportunities, opportunityContacts } from '@/db/schema'
import type { ContactSortColumn, GetContactsInput } from '@/modules/contacts/contacts-schema'

// The number of opportunities this contact brought, and when they were last in touch — both
// correlated rather than joined, so a contact with no opportunity still returns a row.
// See docs/reference/contacts.md
export const opportunityCount = sql<number>`(
  select count(*) from ${opportunityContacts}
  where ${opportunityContacts.contactId} = ${contacts.id}
)`

export const lastExchange = sql<string | null>`(
  select max(${opportunities.lastContactAt})
  from ${opportunityContacts}
  join ${opportunities} on ${opportunities.id} = ${opportunityContacts.opportunityId}
  where ${opportunityContacts.contactId} = ${contacts.id}
)`

export const SORT_EXPRESSIONS: Record<ContactSortColumn, SQL> = {
  name: sql`${contacts.lastName}`,
  company: sql`${contacts.company}`,
  relationship: sql`${contacts.relationship}`,
  lastExchange,
  opportunities: opportunityCount
}

const TEXT_SEARCH_COLUMNS = [
  contacts.firstName,
  contacts.lastName,
  contacts.company,
  contacts.jobTitle,
  contacts.city
]

// A term that is mostly digits is a phone number being looked up, not a name. Both sides are
// reduced to digits so `06 12` finds `+33 6 12` — the incoming-call scenario.
// See docs/reference/contacts.md
const DIGIT_TERM = /^[+\d][\d\s.\-()]*$/

// Mirrors the `digits_only` SQL function, down to folding +33 back to a leading 0 — the two
// must agree exactly or the lookup silently misses. See docs/reference/contacts.md
function digitsOf(term: string) {
  return term.replace(/\D/g, '').replace(/^33/, '0')
}

// Terms AND-ed, columns OR-ed, both sides unaccented — same rule as the opportunities search,
// see docs/reference/server-side-table.md
export function contactSearchMatch(q: string) {
  const terms = q.split(/\s+/).filter(Boolean)
  if (terms.length === 0) return null

  const matchesSomeColumn = (term: string) => {
    const digits = DIGIT_TERM.test(term) ? digitsOf(term) : ''

    return or(
      ...TEXT_SEARCH_COLUMNS.map(
        (column) => sql`immutable_unaccent(${column}) ilike immutable_unaccent(${`%${term}%`})`
      ),
      sql`immutable_unaccent(public.contact_emails_text(${contacts.emails})) ilike immutable_unaccent(${`%${term}%`})`,
      // Guarded: an empty digit string would match every contact holding any phone number.
      ...(digits
        ? [sql`public.contact_phone_digits(${contacts.phones}) like ${`%${digits}%`}`]
        : [])
    )
  }

  return and(...terms.map(matchesSomeColumn)) ?? null
}

// A whitespace-only phone query still has to reach the digit branch, which is why the split
// above runs on the raw string and each term is tested on its own.
type ContactFilters = Pick<GetContactsInput, 'q' | 'relationship'>

export function buildContactsWhere(userId: string, { q, relationship }: ContactFilters) {
  const filters: SQL[] = [eq(contacts.userId, userId)]

  const match = contactSearchMatch(q)
  if (match) filters.push(match)

  if (relationship) filters.push(eq(contacts.relationship, relationship))

  return and(...filters)
}
