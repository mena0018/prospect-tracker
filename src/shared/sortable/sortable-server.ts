import { and, eq, inArray, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { experienceLevels, jobTypes, stages } from '@/db/schema'

type Reorderable = typeof stages | typeof jobTypes | typeof experienceLevels

// The `::integer` cast is load-bearing — see docs/reference/sortable-mechanism.md
export async function writePositions(table: Reorderable, userId: string, ids: string[]) {
  if (ids.length === 0) return

  const cases = ids.map((id, position) => sql`when ${table.id} = ${id} then ${position}::integer`)

  await db
    .update(table)
    .set({ position: sql`(case ${sql.join(cases, sql.raw(' '))} end)` })
    .where(and(eq(table.userId, userId), inArray(table.id, ids)))
}
