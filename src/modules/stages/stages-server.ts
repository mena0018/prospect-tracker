import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { opportunities, stages, type Stage } from '@/db/schema'
import { appError } from '@/lib/error'
import { writePositions } from '@/shared/sortable/sortable-server'
import { requireUser } from '@/lib/supabase/server'
import { todayOnlySchema } from '@/modules/opportunities/opportunities-schema'
import { isDoneTodayExpression, isDueExpression } from '@/modules/opportunities/opportunities-sql'
import {
  createStageSchema,
  deleteStageSchema,
  reorderStagesSchema,
  setStageArchivedSchema,
  updateStageSchema
} from '@/modules/stages/stages-schema'
import { nextFreeStageColor, orderActiveFirst } from '@/modules/stages/stages-utils'

export const getStages = createServerFn({ method: 'GET' }).handler(async (): Promise<Stage[]> => {
  const { id: userId } = await requireUser()

  return db.select().from(stages).where(eq(stages.userId, userId)).orderBy(asc(stages.position))
})

type StageSummary = {
  id: string
  name: string
  color: string
  count: number
  isArchived: boolean
}

type StageCounts = {
  stages: StageSummary[]
  dueCount: number
  doneToday: number
}

export const getStageCounts = createServerFn({ method: 'GET' })
  .validator(todayOnlySchema)
  .handler(async ({ data: { today } }): Promise<StageCounts> => {
    const { id: userId } = await requireUser()

    const rows = await db
      .select({
        id: stages.id,
        name: stages.name,
        color: stages.color,
        position: stages.position,
        isArchived: stages.isArchived,
        count: sql<number>`count(${opportunities.id})`.mapWith(Number),
        dueCount: sql<number>`count(*) filter (where ${isDueExpression(today)})`.mapWith(Number),
        doneToday: sql<number>`count(*) filter (where ${isDoneTodayExpression(today)})`.mapWith(
          Number
        )
      })
      .from(stages)
      .leftJoin(opportunities, eq(opportunities.stageId, stages.id))
      .where(eq(stages.userId, userId))
      .groupBy(stages.id, stages.name, stages.color, stages.position, stages.isArchived)
      .orderBy(asc(stages.position))

    return {
      stages: rows.map(({ id, name, color, count, isArchived }) => ({
        id,
        name,
        color,
        count,
        isArchived
      })),
      dueCount: rows.reduce((sum, row) => sum + row.dueCount, 0),
      doneToday: rows.reduce((sum, row) => sum + row.doneToday, 0)
    }
  })

export const createStage = createServerFn({ method: 'POST' })
  .validator(createStageSchema)
  .handler(async ({ data }) => {
    const { id: userId } = await requireUser()

    const owned = await db
      .select({ position: stages.position, color: stages.color })
      .from(stages)
      .where(eq(stages.userId, userId))

    const nextPosition = owned.reduce((max, row) => Math.max(max, row.position + 1), 0)

    const [created] = await db
      .insert(stages)
      .values({
        userId,
        name: data.name,
        color: data.color ?? nextFreeStageColor(owned.map((row) => row.color)),
        ...(data.reminderDelayDays === undefined
          ? {}
          : { reminderDelayDays: data.reminderDelayDays }),
        position: nextPosition
      })
      .returning()

    if (!created) throw appError('SERVER')

    return created
  })

export const updateStage = createServerFn({ method: 'POST' })
  .validator(updateStageSchema)
  .handler(async ({ data: { id, ...fields } }) => {
    const { id: userId } = await requireUser()

    if (Object.keys(fields).length === 0) throw appError('VALIDATION')

    const [updated] = await db
      .update(stages)
      .set(fields)
      .where(and(eq(stages.id, id), eq(stages.userId, userId)))
      .returning()

    if (!updated) throw appError('NOT_FOUND')

    return updated
  })

export const setStageArchived = createServerFn({ method: 'POST' })
  .validator(setStageArchivedSchema)
  .handler(async ({ data: { id, isArchived } }) => {
    const { id: userId } = await requireUser()

    // A stage keeps its position while archived, which would drop it back into the middle of the
    // pipeline; restoring re-appends it — see docs/reference/customization.md
    const position = isArchived
      ? undefined
      : await db
          .select({ position: stages.position })
          .from(stages)
          .where(eq(stages.userId, userId))
          .then((rows) => rows.reduce((max, row) => Math.max(max, row.position + 1), 0))

    const [updated] = await db
      .update(stages)
      .set({ isArchived, ...(position === undefined ? {} : { position }) })
      .where(and(eq(stages.id, id), eq(stages.userId, userId)))
      .returning()

    if (!updated) throw appError('NOT_FOUND')

    return updated
  })

export const reorderStages = createServerFn({ method: 'POST' })
  .validator(reorderStagesSchema)
  .handler(async ({ data: { ids } }) => {
    const { id: userId } = await requireUser()

    // Every id must belong to the caller before a single position moves, so a foreign id
    // cannot reshuffle someone else's pipeline.
    const owned = await db
      .select({ id: stages.id, isArchived: stages.isArchived })
      .from(stages)
      .where(and(eq(stages.userId, userId), inArray(stages.id, ids)))

    if (owned.length !== ids.length) throw appError('NOT_FOUND')

    const ordered = orderActiveFirst(
      ids,
      new Set(owned.filter((stage) => stage.isArchived).map((stage) => stage.id))
    )

    await writePositions(stages, userId, ordered)

    return { ids: ordered }
  })

export const deleteStage = createServerFn({ method: 'POST' })
  .validator(deleteStageSchema)
  .handler(async ({ data: { id } }) => {
    const { id: userId } = await requireUser()

    const [target] = await db
      .select({ systemKey: stages.systemKey })
      .from(stages)
      .where(and(eq(stages.id, id), eq(stages.userId, userId)))

    if (!target) throw appError('NOT_FOUND')
    if (target.systemKey !== null) throw appError('STAGE_SYSTEM_LOCKED')

    // opportunities.stage_id is ON DELETE RESTRICT: without this check Postgres raises a raw FK
    // error the client cannot tell apart from a crash. See docs/reference/customization.md
    const [{ count } = { count: 0 }] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(opportunities)
      .where(eq(opportunities.stageId, id))

    if (count > 0) throw appError('CONFLICT')

    const [deleted] = await db
      .delete(stages)
      .where(and(eq(stages.id, id), eq(stages.userId, userId), isNull(stages.systemKey)))
      .returning({ id: stages.id })

    if (!deleted) throw appError('NOT_FOUND')

    return deleted
  })
