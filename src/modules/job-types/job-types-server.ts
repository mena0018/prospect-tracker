import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { jobTypes, type JobType } from '@/db/schema'
import { requireUser } from '@/lib/supabase/server'

export const listJobTypes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<JobType[]> => {
    const { id: userId } = await requireUser()

    return db
      .select()
      .from(jobTypes)
      .where(eq(jobTypes.userId, userId))
      .orderBy(asc(jobTypes.position))
  }
)
