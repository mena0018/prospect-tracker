import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { DEFAULT_TJM_REFERENCE } from '@/db/defaults'
import { users } from '@/db/schema'
import { requireUser } from '@/lib/supabase/server'

export const getCustomization = createServerFn().handler(async () => {
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
