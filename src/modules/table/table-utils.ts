import type { PaginationState, SortingState } from '@tanstack/react-table'

export function parseSort(value: string): SortingState {
  const [id, direction] = value.split(':')
  if (!id) return []

  return [{ id, desc: direction === 'desc' }]
}

export function serializeSort(sorting: SortingState): string {
  const entry = sorting[0]

  return entry ? `${entry.id}:${entry.desc ? 'desc' : 'asc'}` : ''
}

export function toPaginationState(page: number, perPage: number): PaginationState {
  return { pageIndex: page - 1, pageSize: perPage }
}

export function fromPaginationState({ pageIndex, pageSize }: PaginationState) {
  return { page: pageIndex + 1, perPage: pageSize }
}
