import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid
} from 'drizzle-orm/pg-core'
import { authUsers } from 'drizzle-orm/supabase'

import { DEFAULT_TJM_REFERENCE } from './defaults'

// Source of truth for the data model. Rationale & reference:
// docs/reference/data-model.md + docs/decisions/0001-user-configurable-pipeline.md.

export const planEnum = pgEnum('plan', ['free', 'pro'])

export const STAGE_COLOR_TOKENS = [
  'slate',
  'blue',
  'teal',
  'green',
  'amber',
  'orange',
  'red',
  'rose',
  'violet',
  'pink'
] as const

export type StageColorToken = (typeof STAGE_COLOR_TOKENS)[number]

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(), // = Supabase Auth UUID (auth.users.id): So no defaultRandom().
    email: text('email').notNull(),
    fullName: text('full_name'),
    jobTitle: text('job_title'),
    avatarUrl: text('avatar_url'),
    tjmReference: integer('tjm_reference').notNull().default(DEFAULT_TJM_REFERENCE),
    plan: planEnum('plan').notNull().default('free'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [authUsers.id],
      name: 'users_id_auth_fk'
    }).onDelete('cascade')
  ]
)

export const stages = pgTable(
  'stages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color').notNull().default('slate'),
    position: integer('position').notNull(),
    reminderDelayDays: integer('reminder_delay_days').notNull().default(7),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check(
      'stages_color_token',
      sql`${table.color} in (${sql.raw(STAGE_COLOR_TOKENS.map((t) => `'${t}'`).join(','))})`
    ),
    index('stages_user_position_idx').on(table.userId, table.position)
  ]
)

export const jobTypes = pgTable('job_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const experienceLevels = pgTable('experience_levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stageId: uuid('stage_id')
      .notNull()
      .references(() => stages.id, { onDelete: 'restrict' }),
    jobTypeId: uuid('job_type_id').references(() => jobTypes.id, { onDelete: 'set null' }),
    experienceId: uuid('experience_id').references(() => experienceLevels.id, {
      onDelete: 'set null'
    }),
    recruiter: text('recruiter').notNull(),
    esn: text('esn'),
    endClient: text('end_client'),
    need: text('need'),
    dailyRate: integer('daily_rate'),
    onsiteDays: smallint('onsite_days'),
    location: text('location'),
    lastContactAt: date('last_contact_at'),
    nextReminderAt: date('next_reminder_at'),
    phone: text('phone'),
    offerUrl: text('offer_url'),
    notes: text('notes'),
    isPinned: boolean('is_pinned').notNull().default(false),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    // One index per sortable column, all prefixed by the lead sort, so a page reads the index
    // instead of sorting the whole filtered set. See docs/reference/server-side-table.md
    index('opportunities_user_pinned_updated_idx').on(
      table.userId,
      table.isPinned.desc(),
      table.updatedAt.desc()
    ),
    index('opportunities_user_pinned_last_contact_idx').on(
      table.userId,
      table.isPinned.desc(),
      table.lastContactAt
    ),
    index('opportunities_user_pinned_recruiter_idx').on(
      table.userId,
      table.isPinned.desc(),
      table.recruiter
    ),
    index('opportunities_user_pinned_daily_rate_idx').on(
      table.userId,
      table.isPinned.desc(),
      table.dailyRate
    ),
    // Joined on every list query; Postgres does not index a foreign key automatically.
    index('opportunities_stage_id_idx').on(table.stageId)
  ]
)

export const usersRelations = relations(users, ({ many }) => ({
  stages: many(stages),
  jobTypes: many(jobTypes),
  experienceLevels: many(experienceLevels),
  opportunities: many(opportunities)
}))

export const stagesRelations = relations(stages, ({ one, many }) => ({
  user: one(users, { fields: [stages.userId], references: [users.id] }),
  opportunities: many(opportunities)
}))

export const jobTypesRelations = relations(jobTypes, ({ one, many }) => ({
  user: one(users, { fields: [jobTypes.userId], references: [users.id] }),
  opportunities: many(opportunities)
}))

export const experienceLevelsRelations = relations(experienceLevels, ({ one, many }) => ({
  user: one(users, { fields: [experienceLevels.userId], references: [users.id] }),
  opportunities: many(opportunities)
}))

export const opportunitiesRelations = relations(opportunities, ({ one }) => ({
  user: one(users, { fields: [opportunities.userId], references: [users.id] }),
  stage: one(stages, { fields: [opportunities.stageId], references: [stages.id] }),
  jobType: one(jobTypes, { fields: [opportunities.jobTypeId], references: [jobTypes.id] }),
  experience: one(experienceLevels, {
    fields: [opportunities.experienceId],
    references: [experienceLevels.id]
  })
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Stage = typeof stages.$inferSelect
export type NewStage = typeof stages.$inferInsert
export type JobType = typeof jobTypes.$inferSelect
export type NewJobType = typeof jobTypes.$inferInsert
export type ExperienceLevel = typeof experienceLevels.$inferSelect
export type NewExperienceLevel = typeof experienceLevels.$inferInsert
export type Opportunity = typeof opportunities.$inferSelect
export type NewOpportunity = typeof opportunities.$inferInsert
