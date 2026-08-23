import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { DataTablePaginationSkeleton } from '@/shared/table/components/data-table-pagination'
import { CELL_LAYOUT, HEADER_ROW_LAYOUT, ROW_LAYOUT } from '@/shared/table/table-layout'

type Props = {
  gridTemplate: string
  rowCount: number
  columnCount: number
  hasSilentColumn?: boolean
}

export function DataTableSkeleton({
  gridTemplate,
  rowCount,
  columnCount,
  hasSilentColumn = false
}: Props) {
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
        <div className="flex min-h-0 min-w-200 flex-1 flex-col">
          <div className={cn(HEADER_ROW_LAYOUT, gridTemplate)}>
            {hasSilentColumn && <div />}
            {Array.from({ length: columnCount }, (_, index) => (
              <div key={index} className="flex h-10 items-center px-3.5 py-2.5">
                <Skeleton className="bg-sidebar h-3 w-full max-w-24" />
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {Array.from({ length: rowCount }, (_, index) => (
              <div key={index} className={cn(ROW_LAYOUT, gridTemplate)}>
                {hasSilentColumn && (
                  <div className="flex items-center justify-center">
                    <Skeleton className="size-3.5 rounded-sm" />
                  </div>
                )}
                {Array.from({ length: columnCount }, (_, cell) => (
                  <div key={cell} className={cn(CELL_LAYOUT, 'h-13')}>
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <DataTablePaginationSkeleton />
    </>
  )
}
