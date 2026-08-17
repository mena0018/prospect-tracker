import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, or, sql, type AnyColumn, type SQL } from 'drizzle-orm'

import { db } from '@/db/client'
import { opportunities, stages } from '@/db/schema'
import { appError } from '@/lib/error'
import { requireUser } from '@/lib/supabase/server'
import {
  createOpportunitySchema,
  deleteOpportunitySchema,
  listOpportunitiesSchema,
  type ListOpportunitiesInput,
  opportunitiesSummarySchema,
  todayOnlySchema,
  updateOpportunitySchema,
  INTERVIEW_POSITION,
  OFFER_POSITION,
  SAVED_POSITION,
  STALE_THRESHOLD_DAYS,
  type SortColumn
} from '@/modules/opportunities/opportunities-schema'
import type { OpportunityDueFlags } from '@/modules/opportunities/utils/rows'

// A row is archived by its own flag or by sitting in an archived stage.
const isArchivedRow = sql`(${opportunities.isArchived} or ${stages.isArchived})`

const dueDate = sql`coalesce(
  ${opportunities.nextReminderAt},
  ${opportunities.lastContactAt} + ${stages.reminderDelayDays}
)`

// The single definition of "due for follow-up" — the client reads this, it never recomputes.
// See docs/reference/data-model.md
const isDueExpression = (today: string) =>
  sql<boolean>`(not ${isArchivedRow} and ${dueDate} is not null and ${dueDate} <= ${today}::date)`

const SORT_EXPRESSIONS: Record<SortColumn, AnyColumn> = {
  lastContactAt: opportunities.lastContactAt,
  recruiter: opportunities.recruiter,
  esn: opportunities.esn,
  endClient: opportunities.endClient,
  dailyRate: opportunities.dailyRate,
  location: opportunities.location,
  stage: stages.name
}

type OpportunitiesPage = {
  rows: OpportunityDueFlags[]
  total: number
  page: number
  pageCount: number
}

type RowFilters = Pick<ListOpportunitiesInput, 'tab' | 'q' | 'due' | 'today'>

const SEARCH_COLUMNS = [
  opportunities.recruiter,
  opportunities.esn,
  opportunities.endClient,
  opportunities.need,
  opportunities.location,
  stages.name
]

// Terms AND-ed, columns OR-ed, both sides unaccented — see docs/reference/server-side-table.md
function searchMatch(q: string) {
  const terms = q.split(/\s+/).filter(Boolean)
  if (terms.length === 0) return null

  const matchesSomeColumn = (term: string) =>
    or(
      // Unaccenting the column, not just the term, is what keeps the expression indexes in play.
      ...SEARCH_COLUMNS.map(
        (column) => sql`immutable_unaccent(${column}) ilike immutable_unaccent(${`%${term}%`})`
      )
    )

  return and(...terms.map(matchesSomeColumn)) ?? null
}

function buildWhere(userId: string, { tab, q, due, today }: RowFilters) {
  const filters: SQL[] = [eq(opportunities.userId, userId)]

  filters.push(tab === 'archived' ? sql`${isArchivedRow}` : sql`not ${isArchivedRow}`)

  const match = searchMatch(q)
  if (match) filters.push(match)

  if (due) filters.push(isDueExpression(today))

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

    const selectPage = (targetPage: number) =>
      db
        .select({
          opportunity: opportunities,
          isDue: isDueExpression(data.today),
          isArchivedRow: sql<boolean>`${isArchivedRow}`
        })
        .from(opportunities)
        .innerJoin(stages, eq(stages.id, opportunities.stageId))
        .where(where)
        .orderBy(...orderBy)
        .limit(perPage)
        .offset((targetPage - 1) * perPage)

    // Two queries beat one `count(*) over()` — see docs/reference/server-side-table.md
    const [counted, requestedRows] = await Promise.all([
      db
        .select({ total: sql<number>`count(*)`.mapWith(Number) })
        .from(opportunities)
        .innerJoin(stages, eq(stages.id, opportunities.stageId))
        .where(where),
      selectPage(page)
    ])

    const total = counted[0]?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / perPage))
    const servedPage = Math.min(page, pageCount)

    // Only an out-of-range `?page=` pays for a second round trip.
    const rows = servedPage === page ? requestedRows : await selectPage(servedPage)

    return {
      rows: rows.map(({ opportunity, isDue, isArchivedRow }) => ({
        ...opportunity,
        isDue,
        isArchivedRow
      })),
      total,
      page: servedPage,
      pageCount
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
  .handler(async ({ data: { today, q } }): Promise<OpportunitiesSummary> => {
    const { id: userId } = await requireUser()

    const isDue = isDueExpression(today)
    const awaitingReply = sql`${stages.position} not in (${INTERVIEW_POSITION}, ${OFFER_POSITION})`

    // Only the tab counts follow the search; the KPIs describe the whole pipeline.
    const match = searchMatch(q)
    const matches = match ?? sql`true`

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
        activeCount: sql<number>`count(*) filter (
          where not ${isArchivedRow} and ${matches}
        )`.mapWith(Number),
        archivedCount: sql<number>`count(*) filter (
          where ${isArchivedRow} and ${matches}
        )`.mapWith(Number)
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

type StageCount = {
  id: string
  name: string
  color: string
  count: number
}

export const getStageCounts = createServerFn({ method: 'GET' })
  .validator(todayOnlySchema)
  .handler(async ({ data: { today } }): Promise<{ stages: StageCount[]; dueCount: number }> => {
    const { id: userId } = await requireUser()

    const rows = await db
      .select({
        id: stages.id,
        name: stages.name,
        color: stages.color,
        position: stages.position,
        count: sql<number>`count(${opportunities.id})`.mapWith(Number),
        dueCount: sql<number>`count(*) filter (where ${isDueExpression(today)})`.mapWith(Number)
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
