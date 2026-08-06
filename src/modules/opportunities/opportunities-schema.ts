import { z } from 'zod/v4'

import { m } from '@/i18n/paraglide/messages'

// See docs/reference/data-model.md for the nullable + optional rule
const nullableText = z.string().trim().nullable().optional()

export const opportunityFieldsSchema = z.object({
  stageId: z.uuid({ error: () => m.validation_stageRequired() }),
  jobTypeId: z.uuid().nullable().optional(),
  experienceId: z.uuid().nullable().optional(),
  recruiter: z
    .string()
    .trim()
    .min(1, { error: () => m.validation_recruiterRequired() })
    .max(200, { error: () => m.validation_recruiterTooLong() }),
  esn: nullableText,
  endClient: nullableText,
  need: nullableText,
  dailyRate: z
    .int({ error: () => m.validation_dailyRateInt() })
    .min(0, { error: () => m.validation_dailyRateNegative() })
    .max(10000, { error: () => m.validation_dailyRateTooHigh() })
    .nullable()
    .optional(),
  onsiteDays: z
    .int({ error: () => m.validation_onsiteDaysInt() })
    .min(0, { error: () => m.validation_onsiteDaysNegative() })
    .max(5, { error: () => m.validation_onsiteDaysMax() })
    .nullable()
    .optional(),
  location: nullableText,
  lastContactAt: z.iso
    .date({ error: () => m.validation_dateInvalid() })
    .nullable()
    .optional(),
  nextReminderAt: z.iso
    .date({ error: () => m.validation_dateInvalid() })
    .nullable()
    .optional(),
  phone: nullableText,
  offerUrl: z
    .url({ error: () => m.validation_offerUrlInvalid() })
    .nullable()
    .optional(),
  notes: nullableText,
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional()
})

export const createOpportunitySchema = opportunityFieldsSchema

export const updateOpportunitySchema = z.object({
  id: z.uuid(),
  ...opportunityFieldsSchema.partial().shape
})

export const deleteOpportunitySchema = z.object({ id: z.uuid() })

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>

export const PAGE_SIZES: number[] = [8, 10, 15]

// Whitelist, not a hint: the value reaches an ORDER BY.
export const SORT_COLUMNS = [
  'lastContactAt',
  'recruiter',
  'esn',
  'endClient',
  'dailyRate',
  'stage',
  'location'
] as const

export type SortColumn = (typeof SORT_COLUMNS)[number]

// Also feeds the route's stripSearchParams, which keeps an unfiltered URL bare.
export const OPPORTUNITIES_SEARCH_DEFAULTS = {
  tab: 'active' as const,
  q: '',
  due: false,
  sort: '',
  page: 1,
  perPage: 8
}

// `column:direction`, normalised on the way in. See docs/reference/server-side-table.md
const isSortableColumn = (value: string): value is SortColumn =>
  SORT_COLUMNS.some((column) => column === value)

const sortParam = z
  .string()
  .transform((value) => {
    const [column, direction] = value.split(':')

    return column && isSortableColumn(column) && (direction === 'asc' || direction === 'desc')
      ? `${column}:${direction}`
      : OPPORTUNITIES_SEARCH_DEFAULTS.sort
  })
  .catch(OPPORTUNITIES_SEARCH_DEFAULTS.sort)

export const opportunitiesSearchSchema = z.object({
  tab: z.enum(['active', 'archived']).catch(OPPORTUNITIES_SEARCH_DEFAULTS.tab),
  q: z.string().catch(OPPORTUNITIES_SEARCH_DEFAULTS.q),
  due: z.boolean().catch(OPPORTUNITIES_SEARCH_DEFAULTS.due),
  sort: sortParam,
  // 1-based in the URL, 0-based in the table.
  page: z.coerce.number().int().min(1).catch(OPPORTUNITIES_SEARCH_DEFAULTS.page),
  perPage: z.coerce
    .number()
    .int()
    .refine((size) => PAGE_SIZES.includes(size))
    .catch(OPPORTUNITIES_SEARCH_DEFAULTS.perPage)
})

export type OpportunitiesSearch = z.infer<typeof opportunitiesSearchSchema>

export const listOpportunitiesSchema = z.object({
  tab: z.enum(['active', 'archived']),
  q: z.string().trim().max(200),
  due: z.boolean(),
  sortBy: z.enum(SORT_COLUMNS).nullable(),
  sortDesc: z.boolean(),
  page: z.int().min(1),
  perPage: z.int().refine((size) => PAGE_SIZES.includes(size)),
  today: z.iso.date()
})

export type ListOpportunitiesInput = z.infer<typeof listOpportunitiesSchema>

export const opportunitiesSummarySchema = z.object({ today: z.iso.date() })

// Pipeline rules shared by the client calculations and their SQL counterparts. See docs/reference/kpis.md
export const SAVED_POSITION = 0
export const INTERVIEW_POSITION = 3
export const OFFER_POSITION = 4
export const STALE_THRESHOLD_DAYS = 7
