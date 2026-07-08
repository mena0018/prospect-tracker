import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { db } from '@/db/client'
import { DEFAULT_EXPERIENCE_LEVELS, DEFAULT_JOB_TYPES, DEFAULT_STAGES } from '@/db/defaults'
import { experienceLevels, jobTypes, stages, users, type User } from '@/db/schema'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { asString } from '@/lib/utils'

export type AuthUser = {
  id: string
  email: string
  provisioned: boolean
}

// Read-only by design: runs on every SSR request. Writes live in provisionUser.
export const fetchUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthUser | null> => {
    const supabase = getSupabaseServerClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user || !user.email) return null

    return {
      id: user.id,
      email: user.email,
      provisioned: user.user_metadata?.provisioned === true
    }
  }
)

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8)
})

export const signInWithPassword = createServerFn({ method: 'POST' })
  .validator(credentialsSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword(data)
    return { error: error ? 'Email ou mot de passe incorrect.' : null }
  })

export const signUpWithPassword = createServerFn({ method: 'POST' })
  .validator(credentialsSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.auth.signUp(data)
    return { error: error ? error.message : null }
  })

// Auth is re-checked here because route guards don't protect server functions:
// they're independently reachable RPC endpoints.
export const provisionUser = createServerFn({ method: 'POST' }).handler(async (): Promise<User> => {
  const supabase = getSupabaseServerClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user || !user.email) {
    throw new Error('Unauthorized')
  }

  const authUser = { id: user.id, email: user.email }

  const dbUser = await db.transaction(async (tx) => {
    const existing = await tx.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, authUser.id)
    })
    if (existing) return existing

    const [inserted] = await tx
      .insert(users)
      .values({
        id: authUser.id,
        email: authUser.email,
        fullName: asString(user.user_metadata?.full_name),
        avatarUrl: asString(user.user_metadata?.avatar_url)
      })
      .returning()

    if (!inserted) throw new Error('Failed to provision user')

    await tx.insert(stages).values(
      DEFAULT_STAGES.map((s) => ({
        userId: inserted.id,
        name: s.name,
        color: s.color,
        position: s.position,
        isArchived: s.isArchived
      }))
    )
    await tx.insert(jobTypes).values(
      DEFAULT_JOB_TYPES.map((j) => ({
        userId: inserted.id,
        name: j.name,
        position: j.position
      }))
    )
    await tx.insert(experienceLevels).values(
      DEFAULT_EXPERIENCE_LEVELS.map((e) => ({
        userId: inserted.id,
        name: e.name,
        position: e.position
      }))
    )

    return inserted
  })

  // Set only after the DB succeeds, so a failed provisioning is retried.
  await supabase.auth.updateUser({ data: { provisioned: true } })

  return dbUser
})
