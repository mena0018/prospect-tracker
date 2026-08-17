import { toFormValues } from '@/modules/opportunities/utils/form-values'

// Type-checking only, never read at runtime. See docs/reference/opportunity-form.md
export const EMPTY_FORM_VALUES = toFormValues(null, '')

export const GRID = 'grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2'
export const FULL_WIDTH = 'sm:col-span-2'
