import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { opportunities, stages } from '@/db/schema'
import { appError } from '@/lib/error'
import { requireUser } from '@/lib/supabase/server'
import {
  createOpportunitySchema,
  deleteOpportunitySchema,
  getBoardSchema,
  getOpportunitiesSchema,
  opportunitiesSummarySchema,
  updateOpportunitySchema,
  BOARD_ROW_LIMIT,
  STALE_THRESHOLD_DAYS
} from '@/modules/opportunities/opportunities-schema'
import {
  awaitingReply,
  buildWhere,
  hasReplied,
  inInterview,
  isContacted,
  isTerminal,
  rescheduledReminder,
  isArchivedRow,
  isDueExpression,
  searchMatch,
  SORT_EXPRESSIONS
} from '@/modules/opportunities/opportunities-sql'
import type { OpportunityDueFlags } from '@/modules/opportunities/utils/rows'

type OpportunitiesPage = {
  rows: OpportunityDueFlags[]
  total: number
  page: number
  pageCount: number
}

export const getOpportunities = createServerFn({ method: 'GET' })
  .validator(getOpportunitiesSchema)
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

export type Board = {
  rows: OpportunityDueFlags[]
  total: number
  // The board is capped, so it has to say when it is showing less than it counted.
  isTruncated: boolean
}

// One flat list, grouped by stage on the client: a per-column query would multiply round trips
// by the pipeline length and still need a client merge. See docs/reference/kanban-view.md
export const getBoard = createServerFn({ method: 'GET' })
  .validator(getBoardSchema)
  .handler(async ({ data }): Promise<Board> => {
    const { id: userId } = await requireUser()

    const where = buildWhere(userId, data)

    const [counted, rows] = await Promise.all([
      db
        .select({ total: sql<number>`count(*)`.mapWith(Number) })
        .from(opportunities)
        .innerJoin(stages, eq(stages.id, opportunities.stageId))
        .where(where),
      db
        .select({
          opportunity: opportunities,
          isDue: isDueExpression(data.today),
          isArchivedRow: sql<boolean>`${isArchivedRow}`
        })
        .from(opportunities)
        .innerJoin(stages, eq(stages.id, opportunities.stageId))
        .where(where)
        // Order within a column is not persisted, so recency stands in for it — pinned first,
        // matching the list. See docs/reference/kanban-view.md
        .orderBy(desc(opportunities.isPinned), desc(opportunities.updatedAt))
        .limit(BOARD_ROW_LIMIT)
    ])

    const total = counted[0]?.total ?? 0

    return {
      rows: rows.map(({ opportunity, isDue, isArchivedRow }) => ({
        ...opportunity,
        isDue,
        isArchivedRow
      })),
      total,
      isTruncated: total > rows.length
    }
  })

export type Kpis = {
  dueToday: number
  stale: number
  interviews: number
  responseRate: number | null
}

type OpportunitiesSummary = {
  kpis: Kpis
  activeCount: number
  archivedCount: number
}

// Aggregates span every row, not the current page. See docs/reference/kpis.md
export const getOpportunitiesSummary = createServerFn({ method: 'GET' })
  .validator(opportunitiesSummarySchema)
  .handler(async ({ data: { today, q, due } }): Promise<OpportunitiesSummary> => {
    const { id: userId } = await requireUser()

    const isDue = isDueExpression(today)

    const match = searchMatch(q)
    // Tab counts carry every active filter — see docs/reference/kpis.md
    const matches = and(match ?? sql`true`, due ? isDue : sql`true`)

    const [row] = await db
      .select({
        dueToday: sql<number>`count(*) filter (where ${isDue})`.mapWith(Number),
        stale: sql<number>`count(*) filter (
          where not ${isArchivedRow}
            and not ${isTerminal}
            and ${isContacted}
            and ${awaitingReply}
            and ${opportunities.lastContactAt} is not null
            and (${today}::date - ${opportunities.lastContactAt}) > ${STALE_THRESHOLD_DAYS}
        )`.mapWith(Number),
        interviews: sql<number>`count(*) filter (
          where not ${isArchivedRow} and ${inInterview}
        )`.mapWith(Number),
        contacted: sql<number>`count(*) filter (
          where ${isContacted}
        )`.mapWith(Number),
        replied: sql<number>`count(*) filter (
          where ${isContacted} and ${hasReplied}
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
      .set({ ...fields, ...rescheduledReminder(fields), updatedAt: new Date() })
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
