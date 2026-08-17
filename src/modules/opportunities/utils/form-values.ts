import type { OpportunityFormValues } from '@/modules/opportunities/opportunities-schema'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

// A non-numeric entry stays a string so z.int() rejects it, rather than becoming NaN or 0.
export function toNumeric(value: unknown) {
  if (typeof value !== 'string') return value

  const trimmed = value.trim()
  if (trimmed === '') return null

  const parsed = Number(trimmed)

  return Number.isFinite(parsed) ? parsed : trimmed
}

export function toOptionalText(value: unknown) {
  if (typeof value !== 'string') return value

  return value.trim() === '' ? null : value.trim()
}

// `today` is passed in rather than read here so the mapping stays pure and the form keeps the
// day it opened on. A new opportunity is contacted the day it is created, which also puts it on
// the follow-up clock straight away instead of leaving it invisible to reminders.
export function toFormValues(row: OpportunityRow | null, fallbackStageId: string, today = '') {
  const text = (value: string | null | undefined) => value ?? ''
  const numeric = (value: number | null | undefined) =>
    value === null || value === undefined ? '' : String(value)

  return {
    stageId: row?.stageId ?? fallbackStageId,
    jobTypeId: row?.jobTypeId ?? null,
    experienceId: row?.experienceId ?? null,
    recruiter: text(row?.recruiter),
    esn: text(row?.esn),
    endClient: text(row?.endClient),
    need: text(row?.need),
    dailyRate: numeric(row?.dailyRate),
    // Select-backed: null is "not specified", where an empty string would be a value.
    onsiteDays:
      row?.onsiteDays === null || row?.onsiteDays === undefined ? null : String(row.onsiteDays),
    location: text(row?.location),
    lastContactAt: row ? text(row.lastContactAt) : today,
    nextReminderAt: text(row?.nextReminderAt),
    phone: text(row?.phone),
    offerUrl: text(row?.offerUrl),
    notes: text(row?.notes)
  } satisfies OpportunityFormValues
}
