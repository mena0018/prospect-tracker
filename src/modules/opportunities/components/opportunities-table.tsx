import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { m } from '@/i18n/paraglide/messages'
import { cn, formatDate, formatValue } from '@/lib/utils'
import { PinButton } from '@/modules/opportunities/components/pin-button'
import { StageBadge } from '@/modules/stages/components/stage-badge'
import {
  OpportunitiesPagination,
  OpportunitiesPaginationSkeleton
} from '@/modules/opportunities/components/opportunities-pagination'
import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import {
  formatDailyRate,
  isAboveReference,
  type OpportunityRow
} from '@/modules/opportunities/opportunities-utils'

const GRID_TEMPLATE =
  'grid-cols-[30px_128px_minmax(148px,1.4fr)_minmax(90px,0.9fr)_minmax(120px,1.1fr)_78px_132px_minmax(110px,1fr)]'

const SCROLL_LAYOUT = 'flex min-h-0 flex-1 flex-col overflow-x-auto'
const SCROLL_INNER_LAYOUT = 'flex min-h-0 min-w-200 flex-1 flex-col'
const HEADER_LAYOUT = 'bg-secondary border-border grid flex-none border-b'
const ROW_LAYOUT = 'border-border-soft grid items-stretch border-b'
const CELL_LAYOUT =
  'text-secondary-foreground flex min-w-0 items-center overflow-hidden p-3.5 whitespace-nowrap'

// The pin column renders outside the header loop, so it isn't counted here.
const HEADER_COLUMN_COUNT = 7

const PIN_SORT = { id: 'pin', desc: true } as const

const columnHelper = createColumnHelper<OpportunityRow>()

type Props = {
  rows: OpportunityRow[]
  total: number
  // Clamped server-side, so it can differ from `?page=`. See docs/reference/server-side-table.md
  servedPage: number
  isFetching: boolean
  dailyRateReference: number
  onTogglePin: (row: OpportunityRow) => void
  emptyTitle: string
  emptyHint: string
}

export function OpportunitiesTable({
  rows,
  total,
  servedPage,
  isFetching,
  dailyRateReference,
  onTogglePin,
  emptyTitle,
  emptyHint
}: Props) {
  const { sorting, pagination, setSorting, setPagination } = useOpportunitiesFilters()

  // Not perf: a new columns array remounts the table and drops its sort/page state.
  const columns = useMemo(
    () => [
      columnHelper.accessor('isPinned', {
        id: 'pin',
        sortingFn: 'basic',
        cell: ({ row }) => (
          <PinButton isPinned={row.original.isPinned} onToggle={() => onTogglePin(row.original)} />
        )
      }),
      columnHelper.accessor('lastContactAt', {
        header: m.table_colLastContact(),
        cell: ({ getValue, row }) => (
          <span
            className={cn(
              'text-sm font-semibold',
              row.original.isDue ? 'text-destructive' : 'text-foreground'
            )}
          >
            {formatDate(getValue())}
          </span>
        )
      }),
      columnHelper.accessor('recruiter', {
        header: m.table_colRecruiter(),
        cell: ({ getValue }) => <span className="truncate text-sm font-semibold">{getValue()}</span>
      }),
      columnHelper.accessor('esn', {
        header: m.table_colEsn(),
        cell: ({ getValue }) => <span className="truncate text-sm">{formatValue(getValue())}</span>
      }),
      columnHelper.accessor('endClient', {
        header: m.table_colEndClient(),
        cell: ({ getValue }) => <span className="truncate text-sm">{formatValue(getValue())}</span>
      }),
      columnHelper.accessor('dailyRate', {
        header: m.table_colDailyRate(),
        cell: ({ getValue }) => {
          const dailyRate = getValue()

          return (
            <span
              className={cn(
                'text-sm font-semibold tabular-nums',
                dailyRate === null
                  ? 'text-muted-foreground'
                  : isAboveReference(dailyRate, dailyRateReference)
                    ? 'text-rate-above'
                    : 'text-rate-below'
              )}
            >
              {formatDailyRate(dailyRate)}
            </span>
          )
        }
      }),
      columnHelper.accessor((row) => row.stage?.position ?? -1, {
        id: 'stage',
        header: m.table_colStage(),
        cell: ({ row }) => {
          const stage = row.original.stage
          if (!stage) return <span className="text-muted-foreground text-sm">—</span>

          return <StageBadge name={stage.name} color={stage.color} />
        }
      }),
      columnHelper.accessor('location', {
        header: m.table_colLocation(),
        cell: ({ getValue }) => <span className="truncate text-sm">{formatValue(getValue())}</span>
      })
    ],
    [dailyRateReference, onTogglePin]
  )

  // Pinning is a permanent lead sort, so pinned rows stay on top of any column sort.
  const sortingWithPin = useMemo(() => [PIN_SORT, ...sorting], [sorting])

  // Served, not requested: paging from a clamped `?page=999` moves relative to what is shown.
  const servedPagination = useMemo(
    () => ({ pageIndex: servedPage - 1, pageSize: pagination.pageSize }),
    [servedPage, pagination.pageSize]
  )

  // The React Compiler skips this component, hence the hand-written useMemo above.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting: sortingWithPin, pagination: servedPagination },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sortingWithPin) : updater
      setSorting(next.filter((entry) => entry.id !== PIN_SORT.id))
    },
    onPaginationChange: (updater) =>
      setPagination(typeof updater === 'function' ? updater(servedPagination) : updater),
    getRowId: (row) => row.id,
    enableSortingRemoval: false,
    // Filtering, sorting and paging happen in SQL. See docs/reference/server-side-table.md
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
    rowCount: total,
    getCoreRowModel: getCoreRowModel()
  })

  const pageRows = table.getRowModel().rows

  return (
    <>
      <div className={SCROLL_LAYOUT}>
        <div className={SCROLL_INNER_LAYOUT}>
          <div className={cn(HEADER_LAYOUT, GRID_TEMPLATE)}>
            <div />
            {table
              .getHeaderGroups()
              .flatMap((headerGroup) => headerGroup.headers)
              .filter((header) => header.id !== 'pin')
              .map((header) => {
                const isSorted = header.column.getIsSorted()

                return (
                  <Button
                    key={header.id}
                    variant="ghost"
                    onClick={header.column.getToggleSortingHandler()}
                    className={cn(
                      'tracking-label text-2xs h-auto gap-1.25 rounded-none px-3.5 py-2.5 font-semibold uppercase',
                      'hover:text-foreground hover:bg-transparent active:bg-transparent data-pressed:bg-transparent',
                      header.id === 'dailyRate' ? 'justify-end' : 'justify-start',
                      isSorted ? 'text-secondary-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <span className="flex flex-col leading-none">
                      <ChevronUp
                        className={cn(
                          'size-2.5',
                          isSorted === 'asc' ? 'text-primary' : 'text-muted-foreground/30'
                        )}
                      />
                      <ChevronDown
                        className={cn(
                          '-mt-0.5 size-2.5',
                          isSorted === 'desc' ? 'text-primary' : 'text-muted-foreground/30'
                        )}
                      />
                    </span>
                  </Button>
                )
              })}
          </div>

          <div
            aria-busy={isFetching}
            className={cn(
              'min-h-0 flex-1 overflow-y-auto transition-opacity',
              // Paging swaps rows without unmounting, so the stale page needs a busy state.
              isFetching && 'pointer-events-none opacity-50'
            )}
          >
            {pageRows.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 px-4 py-14 text-center">
                <span className="font-semibold">{emptyTitle}</span>
                <span className="text-muted-foreground text-xs">{emptyHint}</span>
              </div>
            ) : (
              pageRows.map((row) => (
                <div
                  key={row.id}
                  className={cn(
                    ROW_LAYOUT,
                    'hover:bg-accent/60 transition-colors',
                    GRID_TEMPLATE,
                    row.original.isPinned && 'bg-accent/35'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className={cn(
                        CELL_LAYOUT,
                        cell.column.id === 'pin' && 'justify-center px-0',
                        cell.column.id === 'dailyRate' && 'justify-end'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <OpportunitiesPagination table={table} />
    </>
  )
}

export function OpportunitiesTableSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <>
      <div className={SCROLL_LAYOUT}>
        <div className={SCROLL_INNER_LAYOUT}>
          <div className={cn(HEADER_LAYOUT, GRID_TEMPLATE)}>
            <div />
            {Array.from({ length: HEADER_COLUMN_COUNT }, (_, index) => (
              <div key={index} className="flex h-10 items-center px-3.5 py-2.5">
                <Skeleton className="bg-sidebar h-3 w-full max-w-24" />
              </div>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {Array.from({ length: rowCount }, (_, index) => (
              <div key={index} className={cn(ROW_LAYOUT, GRID_TEMPLATE)}>
                <div className="flex items-center justify-center">
                  <Skeleton className="size-3.5 rounded-sm" />
                </div>
                {Array.from({ length: HEADER_COLUMN_COUNT }, (_, cell) => (
                  <div key={cell} className={`${CELL_LAYOUT} h-13`}>
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <OpportunitiesPaginationSkeleton />
    </>
  )
}
