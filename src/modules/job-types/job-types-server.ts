import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { jobTypes, opportunities, type JobType } from '@/db/schema'
import { appError } from '@/lib/error'
import { writePositions } from '@/shared/sortable/sortable-server'
import { requireUser } from '@/lib/supabase/server'
import {
  createJobTypeSchema,
  deleteJobTypeSchema,
  reorderJobTypesSchema,
  updateJobTypeSchema
} from '@/modules/job-types/job-types-schema'

const owned = (userId: string, id: string) => and(eq(jobTypes.id, id), eq(jobTypes.userId, userId))

export const getJobTypes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<JobType[]> => {
    const { id: userId } = await requireUser()

    return db
      .select()
      .from(jobTypes)
      .where(eq(jobTypes.userId, userId))
      .orderBy(asc(jobTypes.position))
  }
)

export const createJobType = createServerFn({ method: 'POST' })
  .validator(createJobTypeSchema)
  .handler(async ({ data: { name } }) => {
    const { id: userId } = await requireUser()

    const rows = await db
      .select({ position: jobTypes.position })
      .from(jobTypes)
      .where(eq(jobTypes.userId, userId))

    const position = rows.reduce((max, row) => Math.max(max, row.position + 1), 0)

    const [created] = await db.insert(jobTypes).values({ userId, name, position }).returning()

    if (!created) throw appError('SERVER')

    return created
  })

export const updateJobType = createServerFn({ method: 'POST' })
  .validator(updateJobTypeSchema)
  .handler(async ({ data: { id, name } }) => {
    const { id: userId } = await requireUser()

    const [updated] = await db.update(jobTypes).set({ name }).where(owned(userId, id)).returning()

    if (!updated) throw appError('NOT_FOUND')

    return updated
  })

export const reorderJobTypes = createServerFn({ method: 'POST' })
  .validator(reorderJobTypesSchema)
  .handler(async ({ data: { ids } }) => {
    const { id: userId } = await requireUser()

    // Ownership first: a foreign id must not reshuffle someone else's list.
    const found = await db
      .select({ id: jobTypes.id })
      .from(jobTypes)
      .where(and(eq(jobTypes.userId, userId), inArray(jobTypes.id, ids)))

    if (found.length !== ids.length) throw appError('NOT_FOUND')

    await writePositions(jobTypes, userId, ids)

    return { ids }
  })

export const deleteJobType = createServerFn({ method: 'POST' })
  .validator(deleteJobTypeSchema)
  .handler(async ({ data: { id } }) => {
    const { id: userId } = await requireUser()

    const [deleted] = await db
      .delete(jobTypes)
      .where(owned(userId, id))
      .returning({ id: jobTypes.id })

    if (!deleted) throw appError('NOT_FOUND')

    return deleted
  })

export const getJobTypeCounts = createServerFn({ method: 'GET' }).handler(async () => {
  const { id: userId } = await requireUser()

  const rows = await db
    .select({ id: jobTypes.id, count: sql<number>`count(${opportunities.id})`.mapWith(Number) })
    .from(jobTypes)
    .leftJoin(opportunities, eq(opportunities.jobTypeId, jobTypes.id))
    .where(eq(jobTypes.userId, userId))
    .groupBy(jobTypes.id)

  return Object.fromEntries(rows.map(({ id, count }) => [id, count]))
})
