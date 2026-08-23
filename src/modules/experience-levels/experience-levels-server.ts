import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { experienceLevels, opportunities, type ExperienceLevel } from '@/db/schema'
import { appError } from '@/lib/error'
import { writePositions } from '@/shared/sortable/sortable-server'
import { requireUser } from '@/lib/supabase/server'
import {
  createExperienceLevelSchema,
  deleteExperienceLevelSchema,
  reorderExperienceLevelsSchema,
  updateExperienceLevelSchema
} from '@/modules/experience-levels/experience-levels-schema'

const owned = (userId: string, id: string) =>
  and(eq(experienceLevels.id, id), eq(experienceLevels.userId, userId))

export const getExperienceLevels = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ExperienceLevel[]> => {
    const { id: userId } = await requireUser()

    return db
      .select()
      .from(experienceLevels)
      .where(eq(experienceLevels.userId, userId))
      .orderBy(asc(experienceLevels.position))
  }
)

export const createExperienceLevel = createServerFn({ method: 'POST' })
  .validator(createExperienceLevelSchema)
  .handler(async ({ data: { name } }) => {
    const { id: userId } = await requireUser()

    const rows = await db
      .select({ position: experienceLevels.position })
      .from(experienceLevels)
      .where(eq(experienceLevels.userId, userId))

    const position = rows.reduce((max, row) => Math.max(max, row.position + 1), 0)

    const [created] = await db
      .insert(experienceLevels)
      .values({ userId, name, position })
      .returning()

    if (!created) throw appError('SERVER')

    return created
  })

export const updateExperienceLevel = createServerFn({ method: 'POST' })
  .validator(updateExperienceLevelSchema)
  .handler(async ({ data: { id, name } }) => {
    const { id: userId } = await requireUser()

    const [updated] = await db
      .update(experienceLevels)
      .set({ name })
      .where(owned(userId, id))
      .returning()

    if (!updated) throw appError('NOT_FOUND')

    return updated
  })

export const reorderExperienceLevels = createServerFn({ method: 'POST' })
  .validator(reorderExperienceLevelsSchema)
  .handler(async ({ data: { ids } }) => {
    const { id: userId } = await requireUser()

    // Ownership first: a foreign id must not reshuffle someone else's list.
    const found = await db
      .select({ id: experienceLevels.id })
      .from(experienceLevels)
      .where(and(eq(experienceLevels.userId, userId), inArray(experienceLevels.id, ids)))

    if (found.length !== ids.length) throw appError('NOT_FOUND')

    await writePositions(experienceLevels, userId, ids)

    return { ids }
  })

export const deleteExperienceLevel = createServerFn({ method: 'POST' })
  .validator(deleteExperienceLevelSchema)
  .handler(async ({ data: { id } }) => {
    const { id: userId } = await requireUser()

    const [deleted] = await db
      .delete(experienceLevels)
      .where(owned(userId, id))
      .returning({ id: experienceLevels.id })

    if (!deleted) throw appError('NOT_FOUND')

    return deleted
  })

export const getExperienceLevelCounts = createServerFn({ method: 'GET' }).handler(async () => {
  const { id: userId } = await requireUser()

  const rows = await db
    .select({
      id: experienceLevels.id,
      count: sql<number>`count(${opportunities.id})`.mapWith(Number)
    })
    .from(experienceLevels)
    .leftJoin(opportunities, eq(opportunities.experienceId, experienceLevels.id))
    .where(eq(experienceLevels.userId, userId))
    .groupBy(experienceLevels.id)

  return Object.fromEntries(rows.map(({ id, count }) => [id, count]))
})
