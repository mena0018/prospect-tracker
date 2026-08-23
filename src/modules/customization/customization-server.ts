import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { DEFAULT_TJM_REFERENCE } from '@/db/defaults'
import { users } from '@/db/schema'
import { appError } from '@/lib/error'
import { requireUser } from '@/lib/supabase/server'
import { updateDailyRateReferenceSchema } from '@/modules/customization/customization-schema'

export const getDailyRateReference = createServerFn().handler(async () => {
  const { id: userId } = await requireUser()

  const [profile] = await db
    .select({ tjmReference: users.tjmReference })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return {
    dailyRateReference: profile?.tjmReference ?? DEFAULT_TJM_REFERENCE
  }
})

export const updateDailyRateReference = createServerFn({ method: 'POST' })
  .validator(updateDailyRateReferenceSchema)
  .handler(async ({ data: { dailyRateReference } }) => {
    const { id: userId } = await requireUser()

    const [updated] = await db
      .update(users)
      .set({ tjmReference: dailyRateReference, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({ dailyRateReference: users.tjmReference })

    if (!updated) throw appError('NOT_FOUND')

    return updated
  })
