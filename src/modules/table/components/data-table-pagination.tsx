import type { ReactTable, RowData } from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import type { PaginatedTableFeatures } from '@/modules/table/table-features'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const PAGINATION_LAYOUT =
  'border-border-soft flex flex-none flex-wrap items-center justify-between gap-3.5 border-t px-4.5 py-3.25'

type PaginationLabels = {
  range: (parts: { from: number; to: number; total: number }) => string
  pageOf: (parts: { page: number; total: number }) => string
  perPage: string
  firstPage: string
  previousPage: string
  nextPage: string
  lastPage: string
}

type Props<TData extends RowData> = {
  table: ReactTable<PaginatedTableFeatures, TData>
  pageSizes: readonly number[]
  labels: PaginationLabels
}

export function DataTablePagination<TData extends RowData>({
  table,
  pageSizes,
  labels
}: Props<TData>) {
  // Totals come from the server via `rowCount`/`pageCount`, never from the loaded page.
  // See docs/reference/server-side-table.md
  const { pageIndex, pageSize } = table.state.pagination
  const total = table.getRowCount()
  const pageCount = table.getPageCount()

  const from = total === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(total, (pageIndex + 1) * pageSize)

  return (
    <div className={PAGINATION_LAYOUT}>
      <div className="text-secondary-foreground flex items-center gap-3.5">
        <span className="tabular-nums">{labels.range({ from, to, total })}</span>
        <div className="flex items-center gap-1.75">
          {labels.perPage}
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" aria-label={labels.perPage}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          title={labels.firstPage}
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          title={labels.previousPage}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft />
        </Button>
        <span className="text-secondary-foreground px-1.5 tabular-nums">
          {labels.pageOf({ page: pageIndex + 1, total: pageCount })}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          title={labels.nextPage}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          title={labels.lastPage}
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  )
}

export function DataTablePaginationSkeleton() {
  return (
    <div className={PAGINATION_LAYOUT}>
      <div className="flex items-center gap-3.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex items-center gap-1.5">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="mx-1.5 h-4 w-16" />
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="size-8 rounded-md" />
      </div>
    </div>
  )
}
