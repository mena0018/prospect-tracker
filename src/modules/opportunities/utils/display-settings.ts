import { m } from '@/i18n/paraglide/messages'
import { VIEWS, type View } from '@/modules/opportunities/opportunities-schema'

export function isView(value: string): value is View {
  return (VIEWS as readonly string[]).includes(value)
}

// One vocabulary for both views: `hidden=esn` means the same thing whichever one is on screen, so
// switching view keeps the choice instead of resetting it. See docs/reference/kanban-view.md
export const HIDABLE_FIELDS = [
  'lastContactAt',
  'esn',
  'endClient',
  'dailyRate',
  'location'
] as const

export type HidableField = (typeof HIDABLE_FIELDS)[number]

// What each view actually draws — the menu offers a field only where hiding it changes something.
// The card carries no location, and neither view lets the recruiter or the stage go: one names the
// row, the other is what the view is about.
const FIELDS_BY_VIEW: Record<View, readonly HidableField[]> = {
  list: HIDABLE_FIELDS,
  kanban: ['lastContactAt', 'esn', 'endClient', 'dailyRate']
}

export function hidableFieldsFor(view: View) {
  return FIELDS_BY_VIEW[view]
}

function isHidableField(value: string): value is HidableField {
  return (HIDABLE_FIELDS as readonly string[]).includes(value)
}

// Built per call so the labels follow the active locale.
export const FIELD_LABELS = (): Record<HidableField, string> => ({
  lastContactAt: m.table_colLastContact(),
  esn: m.table_colEsn(),
  endClient: m.table_colEndClient(),
  dailyRate: m.table_colDailyRate(),
  location: m.table_colLocation()
})

// Hidden rather than visible fields: the default is everything on, so an untouched setting stores
// nothing and a field added later shows up without a migration.
export function parseHiddenFields(raw: string): HidableField[] {
  return raw.split(',').filter(isHidableField)
}

export function serializeHiddenFields(hidden: readonly HidableField[]) {
  return HIDABLE_FIELDS.filter((field) => hidden.includes(field)).join(',')
}

export function toggleHiddenField(hidden: readonly HidableField[], field: HidableField) {
  return hidden.includes(field) ? hidden.filter((entry) => entry !== field) : [...hidden, field]
}
