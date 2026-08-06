import type { SortingState } from '@tanstack/react-table'

import type { Opportunity, Stage } from '@/db/schema'
import { formatValue } from '@/lib/utils'
import { SORT_COLUMNS, type SortColumn } from '@/modules/opportunities/opportunities-schema'
import type { StageIndex } from '@/modules/stages/stages-utils'

// Follow-up rules: docs/reference/data-model.md
export type OpportunityRow = Opportunity & {
  stage: Stage | undefined
  isDue: boolean
  isArchived: boolean
}

export type StatusTab = 'active' | 'archived'

// ToggleGroup hands back an empty array when the pressed item is clicked again.
export function isStatusTab(value: string | undefined): value is StatusTab {
  return value === 'active' || value === 'archived'
}

export function toSortColumn(value: string): SortColumn | null {
  return SORT_COLUMNS.find((column) => column === value) ?? null
}

// Already normalised to `column:direction` (or empty) by opportunitiesSearchSchema.
export function parseSort(value: string): SortingState {
  const [id, direction] = value.split(':')
  if (!id) return []

  return [{ id, desc: direction === 'desc' }]
}

export function serializeSort(sorting: SortingState): string {
  const entry = sorting[0]

  return entry ? `${entry.id}:${entry.desc ? 'desc' : 'asc'}` : ''
}

export function toRows(
  opportunities: Opportunity[],
  stageIndex: StageIndex,
  today: string
): OpportunityRow[] {
  return opportunities.map((opportunity) => {
    const stage = stageIndex.get(opportunity.stageId)

    return {
      ...opportunity,
      stage,
      isDue: isDueForFollowUp(opportunity, stage, today),
      isArchived: isArchived(opportunity, stage)
    }
  })
}

function todayIso() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}

// The user's day, not the server's, and frozen per page load. See docs/reference/kpis.md
export const TODAY = todayIso()

// Noon UTC so a DST shift can't roll the date over.
function addDays(isoDate: string, days: number) {
  const parsed = new Date(`${isoDate}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null

  parsed.setUTCDate(parsed.getUTCDate() + days)

  return parsed.toISOString().slice(0, 10)
}

export function isArchived(opportunity: Opportunity, stage: Stage | undefined) {
  return opportunity.isArchived || stage?.isArchived === true
}

function followUpDueDate(opportunity: Opportunity, stage: Stage | undefined) {
  if (opportunity.nextReminderAt) return opportunity.nextReminderAt
  if (!opportunity.lastContactAt || !stage) return null

  return addDays(opportunity.lastContactAt, stage.reminderDelayDays)
}

export function isDueForFollowUp(
  opportunity: Opportunity,
  stage: Stage | undefined,
  today: string
) {
  if (isArchived(opportunity, stage)) return false

  const dueDate = followUpDueDate(opportunity, stage)

  return dueDate !== null && dueDate <= today
}

export function formatDailyRate(dailyRate: number | null) {
  return formatValue(dailyRate, ' €')
}

export function isAboveReference(dailyRate: number | null, reference: number) {
  return dailyRate !== null && dailyRate >= reference
}
