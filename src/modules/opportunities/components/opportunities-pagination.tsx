import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { Table } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { m } from '@/i18n/paraglide/messages'
import { PAGE_SIZES } from '@/modules/opportunities/opportunities-schema'
import type { OpportunityRow } from '@/modules/opportunities/opportunities-utils'

const PAGINATION_LAYOUT =
  'border-border-soft flex flex-none flex-wrap items-center justify-between gap-3.5 border-t px-4.5 py-3.25'

type Props = {
  table: Table<OpportunityRow>
}

export function OpportunitiesPagination({ table }: Props) {
  // Only one page is loaded, so totals come from `rowCount`. See docs/reference/server-side-table.md
  const { pageIndex, pageSize } = table.getState().pagination
  const total = table.getRowCount()
  const pageCount = Math.max(1, table.getPageCount())

  const from = total === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(total, (pageIndex + 1) * pageSize)

  return (
    <div className={PAGINATION_LAYOUT}>
      <div className="text-secondary-foreground flex items-center gap-3.5 text-sm">
        <span className="tabular-nums">{m.table_rangeLabel({ from, to, total })}</span>
        <div className="flex items-center gap-1.75">
          {m.table_perPage()}
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger size="sm" aria-label={m.table_perPage()} className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
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
          title={m.table_firstPage()}
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          title={m.table_previousPage()}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft />
        </Button>
        <span className="text-secondary-foreground px-1.5 text-sm tabular-nums">
          {m.table_pageOf({ page: pageIndex + 1, total: pageCount })}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          title={m.table_nextPage()}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          title={m.table_lastPage()}
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  )
}

export function OpportunitiesPaginationSkeleton() {
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
