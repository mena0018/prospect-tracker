import { and, eq, or, sql, type AnyColumn, type SQL } from 'drizzle-orm'

import { opportunities, stages } from '@/db/schema'
import type {
  GetOpportunitiesInput,
  SortColumn
} from '@/modules/opportunities/opportunities-schema'

// A row is archived by its own flag or by sitting in an archived stage.
export const isArchivedRow = sql`(${opportunities.isArchived} or ${stages.isArchived})`

const dueDate = sql`coalesce(
  ${opportunities.nextReminderAt},
  ${opportunities.lastContactAt} + ${stages.reminderDelayDays}
)`

// The single definition of "due for follow-up" — the client reads this, it never recomputes.
// See docs/reference/data-model.md
export const isDueExpression = (today: string) =>
  sql<boolean>`(not ${isArchivedRow} and ${dueDate} is not null and ${dueDate} <= ${today}::date)`

export const SORT_EXPRESSIONS: Record<SortColumn, AnyColumn> = {
  lastContactAt: opportunities.lastContactAt,
  recruiter: opportunities.recruiter,
  esn: opportunities.esn,
  endClient: opportunities.endClient,
  dailyRate: opportunities.dailyRate,
  location: opportunities.location,
  stage: stages.name
}

const SEARCH_COLUMNS = [
  opportunities.recruiter,
  opportunities.esn,
  opportunities.endClient,
  opportunities.need,
  opportunities.location,
  stages.name
]

// Terms AND-ed, columns OR-ed, both sides unaccented — see docs/reference/server-side-table.md
export function searchMatch(q: string) {
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

type RowFilters = Pick<GetOpportunitiesInput, 'tab' | 'q' | 'due' | 'today'>

export function buildWhere(userId: string, { tab, q, due, today }: RowFilters) {
  const filters: SQL[] = [eq(opportunities.userId, userId)]

  filters.push(tab === 'archived' ? sql`${isArchivedRow}` : sql`not ${isArchivedRow}`)

  const match = searchMatch(q)
  if (match) filters.push(match)

  if (due) filters.push(isDueExpression(today))

  return and(...filters)
}
