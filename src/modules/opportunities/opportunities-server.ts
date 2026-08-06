import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, ilike, or, sql, type AnyColumn, type SQL } from 'drizzle-orm'

import { db } from '@/db/client'
import { opportunities, stages, type Opportunity } from '@/db/schema'
import { appError } from '@/lib/error'
import { requireUser } from '@/lib/supabase/server'
import {
  createOpportunitySchema,
  deleteOpportunitySchema,
  listOpportunitiesSchema,
  type ListOpportunitiesInput,
  opportunitiesSummarySchema,
  updateOpportunitySchema,
  INTERVIEW_POSITION,
  OFFER_POSITION,
  SAVED_POSITION,
  STALE_THRESHOLD_DAYS,
  type SortColumn
} from '@/modules/opportunities/opportunities-schema'

// A row is archived by its own flag or by sitting in an archived stage.
const isArchivedRow = sql`(${opportunities.isArchived} or ${stages.isArchived})`

// Mirrors followUpDueDate() in opportunities-utils.ts — keep the two in step.
const dueDate = sql`coalesce(
  ${opportunities.nextReminderAt},
  ${opportunities.lastContactAt} + ${stages.reminderDelayDays}
)`

const SORT_EXPRESSIONS: Record<SortColumn, AnyColumn> = {
  lastContactAt: opportunities.lastContactAt,
  recruiter: opportunities.recruiter,
  esn: opportunities.esn,
  endClient: opportunities.endClient,
  dailyRate: opportunities.dailyRate,
  location: opportunities.location,
  stage: stages.name
}

export type OpportunitiesPage = {
  rows: Opportunity[]
  total: number
  // Clamped; the URL keeps what was asked for. See docs/reference/server-side-table.md
  page: number
}

type RowFilters = Pick<ListOpportunitiesInput, 'tab' | 'q' | 'due' | 'today'>

function buildWhere(userId: string, { tab, q, due, today }: RowFilters) {
  const filters: SQL[] = [eq(opportunities.userId, userId)]

  filters.push(tab === 'archived' ? sql`${isArchivedRow}` : sql`not ${isArchivedRow}`)

  if (q) {
    const pattern = `%${q}%`
    const match = or(
      ilike(opportunities.recruiter, pattern),
      ilike(opportunities.esn, pattern),
      ilike(opportunities.endClient, pattern),
      ilike(opportunities.need, pattern),
      ilike(opportunities.location, pattern),
      ilike(stages.name, pattern)
    )
    if (match) filters.push(match)
  }

  // Archived rows are never due, so the tab filter above already excludes them.
  if (due) filters.push(sql`${dueDate} is not null and ${dueDate} <= ${today}::date`)

  return and(...filters)
}

export const listOpportunities = createServerFn({ method: 'GET' })
  .validator(listOpportunitiesSchema)
  .handler(async ({ data }): Promise<OpportunitiesPage> => {
    const { id: userId } = await requireUser()
    const { sortBy, sortDesc, page, perPage } = data

    const sortExpression = sortBy ? SORT_EXPRESSIONS[sortBy] : null
    const direction = sortDesc ? desc : asc

    const orderBy = [
      // Pinning is a permanent lead sort, so pinned rows stay on top of any column sort.
      desc(opportunities.isPinned),
      ...(sortExpression ? [direction(sortExpression)] : []),
      desc(opportunities.updatedAt)
    ]

    const where = buildWhere(userId, data)

    // Counted first so the offset can be clamped: `?page=999` must not return an empty page.
    const [counted] = await db
      .select({ total: sql<number>`count(*)`.mapWith(Number) })
      .from(opportunities)
      .innerJoin(stages, eq(stages.id, opportunities.stageId))
      .where(where)

    const total = counted?.total ?? 0
    const lastPage = Math.max(1, Math.ceil(total / perPage))
    const safePage = Math.min(page, lastPage)

    const rows = await db
      .select({ opportunity: opportunities })
      .from(opportunities)
      .innerJoin(stages, eq(stages.id, opportunities.stageId))
      .where(where)
      .orderBy(...orderBy)
      .limit(perPage)
      .offset((safePage - 1) * perPage)

    return {
      rows: rows.map((row) => row.opportunity),
      total,
      page: safePage
    }
  })

export type Kpis = {
  dueToday: number
  stale: number
  interviews: number
  responseRate: number | null
}

export type OpportunitiesSummary = {
  kpis: Kpis
  activeCount: number
  archivedCount: number
}

// Aggregates span every row, not the current page. See docs/reference/kpis.md
export const getOpportunitiesSummary = createServerFn({ method: 'GET' })
  .validator(opportunitiesSummarySchema)
  .handler(async ({ data: { today } }): Promise<OpportunitiesSummary> => {
    const { id: userId } = await requireUser()

    const isDue = sql`not ${isArchivedRow} and ${dueDate} is not null and ${dueDate} <= ${today}::date`
    const awaitingReply = sql`${stages.position} not in (${INTERVIEW_POSITION}, ${OFFER_POSITION})`

    const [row] = await db
      .select({
        dueToday: sql<number>`count(*) filter (where ${isDue})`.mapWith(Number),
        stale: sql<number>`count(*) filter (
          where not ${isArchivedRow}
            and ${awaitingReply}
            and ${opportunities.lastContactAt} is not null
            and (${today}::date - ${opportunities.lastContactAt}) > ${STALE_THRESHOLD_DAYS}
        )`.mapWith(Number),
        interviews: sql<number>`count(*) filter (
          where not ${isArchivedRow} and ${stages.position} = ${INTERVIEW_POSITION}
        )`.mapWith(Number),
        contacted: sql<number>`count(*) filter (
          where ${stages.position} <> ${SAVED_POSITION}
        )`.mapWith(Number),
        replied: sql<number>`count(*) filter (
          where ${stages.position} <> ${SAVED_POSITION}
            and (${stages.position} in (${INTERVIEW_POSITION}, ${OFFER_POSITION})
                 or ${stages.isArchived})
        )`.mapWith(Number),
        activeCount: sql<number>`count(*) filter (where not ${isArchivedRow})`.mapWith(Number),
        archivedCount: sql<number>`count(*) filter (where ${isArchivedRow})`.mapWith(Number)
      })
      .from(opportunities)
      .innerJoin(stages, eq(stages.id, opportunities.stageId))
      .where(eq(opportunities.userId, userId))

    const contacted = row?.contacted ?? 0

    return {
      kpis: {
        dueToday: row?.dueToday ?? 0,
        stale: row?.stale ?? 0,
        interviews: row?.interviews ?? 0,
        responseRate: contacted === 0 ? null : Math.round(((row?.replied ?? 0) / contacted) * 100)
      },
      activeCount: row?.activeCount ?? 0,
      archivedCount: row?.archivedCount ?? 0
    }
  })

export type StageCount = {
  id: string
  name: string
  color: string
  count: number
}

export const getStageCounts = createServerFn({ method: 'GET' })
  .validator(opportunitiesSummarySchema)
  .handler(async ({ data: { today } }): Promise<{ stages: StageCount[]; dueCount: number }> => {
    const { id: userId } = await requireUser()

    const rows = await db
      .select({
        id: stages.id,
        name: stages.name,
        color: stages.color,
        position: stages.position,
        count: sql<number>`count(${opportunities.id})`.mapWith(Number),
        dueCount: sql<number>`count(*) filter (
          where not ${isArchivedRow}
            and ${dueDate} is not null
            and ${dueDate} <= ${today}::date
        )`.mapWith(Number)
      })
      .from(stages)
      .leftJoin(opportunities, eq(opportunities.stageId, stages.id))
      .where(eq(stages.userId, userId))
      .groupBy(stages.id, stages.name, stages.color, stages.position)
      .orderBy(asc(stages.position))

    return {
      stages: rows.map(({ id, name, color, count }) => ({ id, name, color, count })),
      dueCount: rows.reduce((sum, row) => sum + row.dueCount, 0)
    }
  })

export const createOpportunity = createServerFn({ method: 'POST' })
  .validator(createOpportunitySchema)
  .handler(async ({ data }) => {
    const { id: userId } = await requireUser()

    const [created] = await db
      .insert(opportunities)
      .values({ ...data, userId })
      .returning()

    if (!created) throw appError('SERVER')

    return created
  })

export const updateOpportunity = createServerFn({ method: 'POST' })
  .validator(updateOpportunitySchema)
  .handler(async ({ data: { id, ...fields } }) => {
    const { id: userId } = await requireUser()

    // Drizzle bypasses RLS. See docs/reference/data-access-security.md.
    const [updated] = await db
      .update(opportunities)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
      .returning()

    if (!updated) throw appError('NOT_FOUND')

    return updated
  })

export const deleteOpportunity = createServerFn({ method: 'POST' })
  .validator(deleteOpportunitySchema)
  .handler(async ({ data: { id } }) => {
    const { id: userId } = await requireUser()

    const [deleted] = await db
      .delete(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
      .returning({ id: opportunities.id })

    if (!deleted) throw appError('NOT_FOUND')

    return deleted
  })
