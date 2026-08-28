import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { contacts, opportunities, opportunityContacts, stages } from '@/db/schema'
import { appError } from '@/lib/error'
import { requireUser } from '@/lib/supabase/server'
import {
  contactDetailSchema,
  createContactSchema,
  deleteContactSchema,
  getContactsSchema,
  searchContactsSchema,
  setOpportunityContactsSchema,
  updateContactSchema
} from '@/modules/contacts/contacts-schema'
import {
  buildContactsWhere,
  lastExchange,
  opportunityCount,
  SORT_EXPRESSIONS
} from '@/modules/contacts/contacts-sql'
import type { Contact } from '@/db/schema'

export type ContactListRow = Contact & {
  opportunityCount: number
  lastExchange: string | null
}

type ContactsPage = {
  rows: ContactListRow[]
  total: number
  page: number
  pageCount: number
}

export const getContacts = createServerFn({ method: 'GET' })
  .validator(getContactsSchema)
  .handler(async ({ data }): Promise<ContactsPage> => {
    const { id: userId } = await requireUser()
    const { sortBy, sortDesc, page, perPage } = data

    const direction = sortDesc ? desc : asc
    const sortExpression = sortBy ? SORT_EXPRESSIONS[sortBy] : null

    const orderBy = [
      ...(sortExpression ? [direction(sortExpression)] : []),
      // Stable tiebreak, and the default order when no column is picked.
      asc(contacts.lastName),
      asc(contacts.firstName),
      asc(contacts.id)
    ]

    const where = buildContactsWhere(userId, data)

    const selectPage = (targetPage: number) =>
      db
        .select({
          contact: contacts,
          opportunityCount: opportunityCount.mapWith(Number),
          lastExchange
        })
        .from(contacts)
        .where(where)
        .orderBy(...orderBy)
        .limit(perPage)
        .offset((targetPage - 1) * perPage)

    // Two queries beat one `count(*) over()` — see docs/reference/server-side-table.md
    const [counted, requestedRows] = await Promise.all([
      db
        .select({ total: sql<number>`count(*)`.mapWith(Number) })
        .from(contacts)
        .where(where),
      selectPage(page)
    ])

    const total = counted[0]?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / perPage))
    const servedPage = Math.min(page, pageCount)

    // Only an out-of-range `?page=` pays for a second round trip.
    const rows = servedPage === page ? requestedRows : await selectPage(servedPage)

    return {
      rows: rows.map(({ contact, opportunityCount: count, lastExchange: last }) => ({
        ...contact,
        opportunityCount: count,
        lastExchange: last
      })),
      total,
      page: servedPage,
      pageCount
    }
  })

export type ContactOpportunity = {
  id: string
  need: string | null
  esn: string | null
  endClient: string | null
  dailyRate: number | null
  lastContactAt: string | null
  isArchived: boolean
  stageName: string
  stageColor: string
}

type ContactDetail = {
  contact: Contact
  opportunities: ContactOpportunity[]
}

// The reading direction the ticket exists for: from a contact, every opportunity they brought.
export const getContact = createServerFn({ method: 'GET' })
  .validator(contactDetailSchema)
  .handler(async ({ data: { id } }): Promise<ContactDetail> => {
    const { id: userId } = await requireUser()

    const contact = await db.query.contacts.findFirst({
      where: (c, { and: all, eq: equals }) => all(equals(c.id, id), equals(c.userId, userId))
    })

    if (!contact) throw appError('NOT_FOUND')

    const rows = await db
      .select({
        id: opportunities.id,
        need: opportunities.need,
        esn: opportunities.esn,
        endClient: opportunities.endClient,
        dailyRate: opportunities.dailyRate,
        lastContactAt: opportunities.lastContactAt,
        isArchived: sql<boolean>`(${opportunities.isArchived} or ${stages.isArchived})`,
        stageName: stages.name,
        stageColor: stages.color
      })
      .from(opportunityContacts)
      .innerJoin(opportunities, eq(opportunities.id, opportunityContacts.opportunityId))
      .innerJoin(stages, eq(stages.id, opportunities.stageId))
      .where(and(eq(opportunityContacts.contactId, id), eq(opportunities.userId, userId)))
      .orderBy(desc(opportunities.lastContactAt), desc(opportunities.updatedAt))

    return { contact, opportunities: rows }
  })

// Feeds the link picker in the opportunity sheet: few rows, no pagination.
export const searchContacts = createServerFn({ method: 'GET' })
  .validator(searchContactsSchema)
  .handler(async ({ data: { q, limit } }): Promise<Contact[]> => {
    const { id: userId } = await requireUser()

    return db
      .select()
      .from(contacts)
      .where(buildContactsWhere(userId, { q, relationship: '' }))
      .orderBy(asc(contacts.lastName), asc(contacts.firstName))
      .limit(limit)
  })

export const createContact = createServerFn({ method: 'POST' })
  .validator(createContactSchema)
  .handler(async ({ data }): Promise<Contact> => {
    const { id: userId } = await requireUser()

    const [created] = await db
      .insert(contacts)
      .values({ ...data, userId })
      .returning()

    if (!created) throw appError('SERVER')

    return created
  })

export const updateContact = createServerFn({ method: 'POST' })
  .validator(updateContactSchema)
  .handler(async ({ data: { id, ...fields } }): Promise<Contact> => {
    const { id: userId } = await requireUser()

    // Drizzle bypasses RLS. See docs/reference/data-access-security.md.
    const [updated] = await db
      .update(contacts)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .returning()

    if (!updated) throw appError('NOT_FOUND')

    return updated
  })

// Deleting a contact deletes no opportunity: the cascade runs on the join table only.
export const deleteContact = createServerFn({ method: 'POST' })
  .validator(deleteContactSchema)
  .handler(async ({ data: { id } }) => {
    const { id: userId } = await requireUser()

    const [deleted] = await db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .returning({ id: contacts.id })

    if (!deleted) throw appError('NOT_FOUND')

    return deleted
  })

// Linking ---------------------------------------------------------------------

// One write for the whole list: linking, unlinking and reordering are the same operation, and
// `position` is the array index — see docs/reference/contacts.md
export const setOpportunityContacts = createServerFn({ method: 'POST' })
  .validator(setOpportunityContactsSchema)
  .handler(async ({ data: { opportunityId, contactIds } }) => {
    const { id: userId } = await requireUser()

    return db.transaction(async (tx) => {
      const opportunity = await tx.query.opportunities.findFirst({
        where: (o, { and: all, eq: equals }) =>
          all(equals(o.id, opportunityId), equals(o.userId, userId)),
        columns: { id: true }
      })

      if (!opportunity) throw appError('NOT_FOUND')

      // Every id has to be one of this user's contacts, or a crafted payload would link a row
      // across accounts — Drizzle bypasses RLS.
      if (contactIds.length > 0) {
        const owned = await tx
          .select({ id: contacts.id })
          .from(contacts)
          .where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)))

        if (owned.length !== new Set(contactIds).size) throw appError('NOT_FOUND')
      }

      await tx
        .delete(opportunityContacts)
        .where(eq(opportunityContacts.opportunityId, opportunityId))

      if (contactIds.length > 0) {
        await tx
          .insert(opportunityContacts)
          .values(contactIds.map((contactId, position) => ({ opportunityId, contactId, position })))
      }

      // The tracker column reads the primary contact, so the row's own timestamp has to move.
      await tx
        .update(opportunities)
        .set({ updatedAt: new Date() })
        .where(eq(opportunities.id, opportunityId))

      return { opportunityId, contactIds }
    })
  })
