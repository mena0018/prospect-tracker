import { m } from '@/i18n/paraglide/messages'
import { VIEWS, type View } from '@/modules/opportunities/opportunities-schema'

export function isView(value: string): value is View {
  return (VIEWS as readonly string[]).includes(value)
}

// The recruiter and the stage stay: one names the row, the other is what the table is about.
// See docs/reference/kanban-view.md
export const HIDABLE_COLUMNS = [
  'lastContactAt',
  'esn',
  'endClient',
  'dailyRate',
  'location'
] as const

export type HidableColumn = (typeof HIDABLE_COLUMNS)[number]

function isHidableColumn(value: string): value is HidableColumn {
  return (HIDABLE_COLUMNS as readonly string[]).includes(value)
}

// Built per call so the labels follow the active locale.
export const COLUMN_LABELS = (): Record<HidableColumn, string> => ({
  lastContactAt: m.table_colLastContact(),
  esn: m.table_colEsn(),
  endClient: m.table_colEndClient(),
  dailyRate: m.table_colDailyRate(),
  location: m.table_colLocation()
})

// Hidden rather than visible columns: the default is everything on, so an untouched setting
// stores nothing and a column added later shows up without a migration.
export function parseHiddenColumns(raw: string): HidableColumn[] {
  return raw.split(',').filter(isHidableColumn)
}

export function serializeHiddenColumns(hidden: readonly HidableColumn[]) {
  return HIDABLE_COLUMNS.filter((column) => hidden.includes(column)).join(',')
}

export function toggleHiddenColumn(hidden: readonly HidableColumn[], column: HidableColumn) {
  return hidden.includes(column) ? hidden.filter((entry) => entry !== column) : [...hidden, column]
}
