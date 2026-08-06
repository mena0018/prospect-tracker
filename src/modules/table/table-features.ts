import {
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures
} from '@tanstack/react-table'

export const tableModuleFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortFns: { basic: sortFn_basic }
})

export type PaginatedTableFeatures = typeof tableModuleFeatures
