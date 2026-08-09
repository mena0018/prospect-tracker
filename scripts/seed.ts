import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '../src/db/schema'
import { experienceLevels, jobTypes, opportunities, stages } from '../src/db/schema'
import { SEED_OPPORTUNITIES } from './seed-data'

// Standalone connection: src/db/client.ts pulls @/lib/env, which reads import.meta.env
// and only resolves inside Vite. See docs/reference/seed-data.md
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is not set — run with `--env-file=.env`')

const client = postgres(databaseUrl, { prepare: false })
const db = drizzle({ client, schema })

const args = process.argv.slice(2)
const emailArg = args.find((arg) => arg.startsWith('--email='))?.slice('--email='.length)
const shouldReset = args.includes('--reset')
const clearOnly = args.includes('--clear')

function isoDateFromOffset(offsetDays: number | null) {
  if (offsetDays === null) return null

  // Noon UTC so a DST shift can't roll the date over (same rule as opportunities-utils).
  const date = new Date()
  date.setUTCHours(12, 0, 0, 0)
  date.setUTCDate(date.getUTCDate() + offsetDays)

  return date.toISOString().slice(0, 10)
}

async function resolveUser(email: string | undefined) {
  const user = email
    ? await db.query.users.findFirst({ where: (u, { eq: equals }) => equals(u.email, email) })
    : await db.query.users.findFirst({ orderBy: (u, { asc }) => asc(u.createdAt) })

  if (!user) {
    throw new Error(
      email
        ? `No user found for ${email} — sign up first, the row is created on first login.`
        : 'No user in the database — sign up first, the row is created on first login.'
    )
  }

  return user
}

async function main() {
  const user = await resolveUser(emailArg)
  console.log(`Target user: ${user.email}`)

  if (clearOnly) {
    const deleted = await db
      .delete(opportunities)
      .where(eq(opportunities.userId, user.id))
      .returning({ id: opportunities.id })

    console.log(`Deleted ${deleted.length} opportunities for ${user.email}`)
    return
  }

  const [userStages, userJobTypes, userExperiences] = await Promise.all([
    db.select().from(stages).where(eq(stages.userId, user.id)),
    db.select().from(jobTypes).where(eq(jobTypes.userId, user.id)),
    db.select().from(experienceLevels).where(eq(experienceLevels.userId, user.id))
  ])

  if (userStages.length === 0) {
    throw new Error(
      `User ${user.email} has no stages — log into the app once so provisionUser seeds the pipeline.`
    )
  }

  const stageByPosition = new Map(userStages.map((stage) => [stage.position, stage]))
  const jobTypeByPosition = new Map(userJobTypes.map((jobType) => [jobType.position, jobType]))
  const experienceByPosition = new Map(
    userExperiences.map((experience) => [experience.position, experience])
  )

  const rows = SEED_OPPORTUNITIES.map((seed) => {
    const stage = stageByPosition.get(seed.stagePosition)
    if (!stage) throw new Error(`No stage at position ${seed.stagePosition} for ${user.email}`)

    const jobType =
      seed.jobTypePosition === null ? null : (jobTypeByPosition.get(seed.jobTypePosition) ?? null)
    const experience =
      seed.experiencePosition === null
        ? null
        : (experienceByPosition.get(seed.experiencePosition) ?? null)

    return {
      userId: user.id,
      stageId: stage.id,
      jobTypeId: jobType?.id ?? null,
      experienceId: experience?.id ?? null,
      recruiter: seed.recruiter,
      esn: seed.esn,
      endClient: seed.endClient,
      need: seed.need,
      dailyRate: seed.dailyRate,
      onsiteDays: seed.onsiteDays,
      location: seed.location,
      lastContactAt: isoDateFromOffset(seed.lastContactOffset),
      nextReminderAt: isoDateFromOffset(seed.nextReminderOffset),
      phone: seed.phone,
      offerUrl: seed.offerUrl,
      notes: seed.notes,
      isPinned: seed.isPinned,
      isArchived: seed.isArchived
    }
  })

  const inserted = await db.transaction(async (tx) => {
    if (shouldReset) {
      await tx.delete(opportunities).where(eq(opportunities.userId, user.id))
    }

    return tx.insert(opportunities).values(rows).returning({ id: opportunities.id })
  })

  console.log(
    `Seeded ${inserted.length} opportunities for ${user.email}${shouldReset ? ' (existing rows deleted)' : ''}`
  )
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => client.end())
