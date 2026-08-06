import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { db } from '@/db/client'
import { credentialsSchema, signUpSchema } from '@/modules/auth/auth-schema'
import { toAuthErrorCode } from '@/modules/auth/auth-utils'
import { DEFAULT_EXPERIENCE_LEVELS, DEFAULT_JOB_TYPES, DEFAULT_STAGES } from '@/db/defaults'
import { experienceLevels, jobTypes, stages, users, type User } from '@/db/schema'
import { type ErrorCode } from '@/lib/error'
import { APP_ROUTES } from '@/lib/routes'
import { getSupabaseServerClient, requireUser } from '@/lib/supabase/server'
import { asString } from '@/lib/utils'

export type AuthUser = {
  id: string
  email: string
  fullName: string | null
  jobTitle: string | null
  avatarUrl: string | null
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
      fullName: asString(user.user_metadata?.full_name),
      jobTitle: asString(user.user_metadata?.job_title),
      avatarUrl: asString(user.user_metadata?.avatar_url),
      provisioned: user.user_metadata?.provisioned === true
    }
  }
)

export const signInWithPassword = createServerFn({ method: 'POST' })
  .validator(credentialsSchema)
  .handler(async ({ data }): Promise<{ errorCode: ErrorCode | null }> => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword(data)

    if (!error) return { errorCode: null }

    const code = toAuthErrorCode(error.code)
    const SAFE_TO_REVEAL = ['RATE_LIMITED', 'AUTH_SIGNUP_DISABLED'] as const
    const isSafeToReveal = SAFE_TO_REVEAL.some((safeCode) => safeCode === code)

    return { errorCode: isSafeToReveal ? code : 'AUTH_INVALID_CREDENTIALS' }
  })

export const signUpWithPassword = createServerFn({ method: 'POST' })
  .validator(signUpSchema)
  .handler(
    async ({
      data: { email, password, fullName, jobTitle }
    }): Promise<{ errorCode: ErrorCode | null }> => {
      const supabase = getSupabaseServerClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, job_title: jobTitle } }
      })

      if (!error) return { errorCode: null }

      return { errorCode: toAuthErrorCode(error.code) }
    }
  )

export const provisionUser = createServerFn({ method: 'POST' }).handler(async (): Promise<User> => {
  const user = await requireUser()

  // An account without email can't be provisioned: send them back rather than half-creating a row.
  if (!user.email) throw redirect({ to: APP_ROUTES.login })

  const authUser = { id: user.id, email: user.email }

  try {
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
          jobTitle: asString(user.user_metadata?.job_title),
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
    await getSupabaseServerClient().auth.updateUser({ data: { provisioned: true } })

    return dbUser
  } catch (err) {
    console.error('provisionUser failed for', authUser.id, err)
    throw err
  }
})
