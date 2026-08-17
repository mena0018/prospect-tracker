import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { experienceLevels, type ExperienceLevel } from '@/db/schema'
import { requireUser } from '@/lib/supabase/server'

export const listExperienceLevels = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ExperienceLevel[]> => {
    const { id: userId } = await requireUser()

    return db
      .select()
      .from(experienceLevels)
      .where(eq(experienceLevels.userId, userId))
      .orderBy(asc(experienceLevels.position))
  }
)
