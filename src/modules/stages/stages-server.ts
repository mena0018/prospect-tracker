import { createServerFn } from '@tanstack/react-start'
import { asc, eq, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { opportunities, stages, type Stage } from '@/db/schema'
import { requireUser } from '@/lib/supabase/server'
import { todayOnlySchema } from '@/modules/opportunities/opportunities-schema'
import { isDoneTodayExpression, isDueExpression } from '@/modules/opportunities/opportunities-sql'

export const getStages = createServerFn({ method: 'GET' }).handler(async (): Promise<Stage[]> => {
  const { id: userId } = await requireUser()

  return db.select().from(stages).where(eq(stages.userId, userId)).orderBy(asc(stages.position))
})

type StageSummary = {
  id: string
  name: string
  color: string
  count: number
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
        count: sql<number>`count(${opportunities.id})`.mapWith(Number),
        dueCount: sql<number>`count(*) filter (where ${isDueExpression(today)})`.mapWith(Number),
        doneToday: sql<number>`count(*) filter (where ${isDoneTodayExpression(today)})`.mapWith(
          Number
        )
      })
      .from(stages)
      .leftJoin(opportunities, eq(opportunities.stageId, stages.id))
      .where(eq(stages.userId, userId))
      .groupBy(stages.id, stages.name, stages.color, stages.position)
      .orderBy(asc(stages.position))

    return {
      stages: rows.map(({ id, name, color, count }) => ({ id, name, color, count })),
      dueCount: rows.reduce((sum, row) => sum + row.dueCount, 0),
      doneToday: rows.reduce((sum, row) => sum + row.doneToday, 0)
    }
  })
