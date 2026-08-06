import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { stages, type Stage } from '@/db/schema'
import { requireUser } from '@/lib/supabase/server'

export const listStages = createServerFn({ method: 'GET' }).handler(async (): Promise<Stage[]> => {
  const { id: userId } = await requireUser()

  return db.select().from(stages).where(eq(stages.userId, userId)).orderBy(asc(stages.position))
})
