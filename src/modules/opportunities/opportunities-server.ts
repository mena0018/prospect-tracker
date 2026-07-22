import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { opportunities, type Opportunity } from '@/db/schema'
import { appError } from '@/lib/error'
import { requireUser } from '@/lib/supabase/server'
import {
  createOpportunitySchema,
  deleteOpportunitySchema,
  updateOpportunitySchema
} from '@/modules/opportunities/opportunities-schema'

export const listOpportunities = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Opportunity[]> => {
    const { id: userId } = await requireUser()

    return db
      .select()
      .from(opportunities)
      .where(eq(opportunities.userId, userId))
      .orderBy(desc(opportunities.isPinned), desc(opportunities.updatedAt))
  }
)

export const createOpportunity = createServerFn({ method: 'POST' })
  .validator(createOpportunitySchema)
  .handler(async ({ data }) => {
    const { id: userId } = await requireUser()

    const [created] = await db
      .insert(opportunities)
      .values({ ...data, userId })
      .returning()

    if (!created) throw appError('SERVER')

    return created
  })

export const updateOpportunity = createServerFn({ method: 'POST' })
  .validator(updateOpportunitySchema)
  .handler(async ({ data: { id, ...fields } }) => {
    const { id: userId } = await requireUser()

    // Drizzle bypasses RLS. See docs/reference/data-access-security.md.
    const [updated] = await db
      .update(opportunities)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
      .returning()

    if (!updated) throw appError('NOT_FOUND')

    return updated
  })

export const deleteOpportunity = createServerFn({ method: 'POST' })
  .validator(deleteOpportunitySchema)
  .handler(async ({ data: { id } }) => {
    const { id: userId } = await requireUser()

    const [deleted] = await db
      .delete(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
      .returning({ id: opportunities.id })

    if (!deleted) throw appError('NOT_FOUND')

    return deleted
  })
