import { createColumnHelper, useTable } from '@tanstack/react-table'

import { m } from '@/i18n/paraglide/messages'
import { cn, formatDate, formatValue } from '@/lib/utils'
import { PinButton } from '@/modules/opportunities/components/pin-button'
import { OpportunityRowActions } from '@/modules/opportunities/components/opportunity-row-actions'
import { StageBadge } from '@/modules/stages/components/stage-badge'
import { DataTable } from '@/shared/table/components/data-table'
import { DataTablePagination } from '@/shared/table/components/data-table-pagination'
import { tableModuleFeatures } from '@/shared/table/table-features'
import { PAGE_SIZES } from '@/modules/opportunities/opportunities-schema'
import { useOpportunitiesFilters } from '@/modules/opportunities/hooks/use-opportunities-filters'
import { formatDailyRate, isAboveReference } from '@/modules/opportunities/utils/display'
import type { OpportunityRow } from '@/modules/opportunities/utils/rows'

const PIN_COLUMN_ID = 'pin'
const ACTIONS_COLUMN_ID = 'actions'

// Per column, so hiding one drops its track instead of stretching the rest — a fixed template
// and a shorter row would misalign every header. See docs/reference/kanban-view.md
const COLUMN_TRACKS: Record<string, string> = {
  [PIN_COLUMN_ID]: '30px',
  lastContactAt: '150px',
  recruiter: 'minmax(140px,1fr)',
  esn: 'minmax(130px,0.9fr)',
  endClient: 'minmax(150px,1.15fr)',
  dailyRate: '78px',
  stage: '156px',
  location: 'minmax(120px,0.95fr)',
  [ACTIONS_COLUMN_ID]: '44px'
}

// Through a variable, not an interpolated `grid-cols-[…]`: Tailwind extracts classes from source
// text, so a class name assembled at runtime generates no CSS at all.
const GRID_TEMPLATE_CLASS = 'grid-cols-(--table-columns)'

const gridTracks = (columnIds: readonly string[]) =>
  columnIds.map((id) => COLUMN_TRACKS[id] ?? 'minmax(120px,1fr)').join(' ')

export const OPPORTUNITIES_GRID_TEMPLATE = GRID_TEMPLATE_CLASS

export const OPPORTUNITIES_GRID_TRACKS = gridTracks(Object.keys(COLUMN_TRACKS))

export const OPPORTUNITIES_COLUMN_COUNT = 7

const PIN_SORT = { id: PIN_COLUMN_ID, desc: true } as const

const columnHelper = createColumnHelper<typeof tableModuleFeatures, OpportunityRow>()

const cellClassName = (columnId: string) =>
  columnId === PIN_COLUMN_ID || columnId === ACTIONS_COLUMN_ID
    ? 'justify-center px-0'
    : columnId === 'dailyRate'
      ? 'justify-end'
      : undefined

type Props = {
  rows: OpportunityRow[]
  total: number
  // Clamped server-side, so it can differ from `?page=`. See docs/reference/server-side-table.md
  servedPage: number
  pageCount: number
  isFetching: boolean
  dailyRateReference: number
  onTogglePin: (row: OpportunityRow) => void
  onEdit: (row: OpportunityRow) => void
  onToggleArchive: (row: OpportunityRow) => void
  onDelete: (row: OpportunityRow) => void
  emptyTitle: string
  emptyHint: string
}

export function OpportunitiesTable({
  rows,
  total,
  servedPage,
  pageCount,
  isFetching,
  dailyRateReference,
  onTogglePin,
  onEdit,
  onToggleArchive,
  onDelete,
  emptyTitle,
  emptyHint
}: Props) {
  const { sorting, pagination, hiddenColumns, setSorting, setPagination } =
    useOpportunitiesFilters()

  const paginationLabels = {
    range: m.table_rangeLabel,
    pageOf: m.table_pageOf,
    perPage: m.table_perPage(),
    firstPage: m.table_firstPage(),
    previousPage: m.table_previousPage(),
    nextPage: m.table_nextPage(),
    lastPage: m.table_lastPage()
  }

  const columns = columnHelper.columns([
    columnHelper.accessor('isPinned', {
      id: PIN_COLUMN_ID,
      sortFn: 'basic',
      cell: ({ row }) => (
        <PinButton isPinned={row.original.isPinned} onToggle={() => onTogglePin(row.original)} />
      )
    }),
    columnHelper.accessor('lastContactAt', {
      id: 'lastContactAt',
      header: m.table_colLastContact(),
      cell: ({ getValue, row }) => (
        <span
          className={cn(
            'font-semibold',
            row.original.isDue ? 'text-destructive' : 'text-foreground'
          )}
        >
          {formatDate(getValue())}
        </span>
      )
    }),
    columnHelper.accessor('recruiter', {
      id: 'recruiter',
      header: m.table_colRecruiter(),
      cell: ({ getValue }) => <span className="truncate font-semibold">{getValue()}</span>
    }),
    columnHelper.accessor('esn', {
      id: 'esn',
      header: m.table_colEsn(),
      cell: ({ getValue }) => <span className="truncate">{formatValue(getValue())}</span>
    }),
    columnHelper.accessor('endClient', {
      id: 'endClient',
      header: m.table_colEndClient(),
      cell: ({ getValue }) => <span className="truncate">{formatValue(getValue())}</span>
    }),
    columnHelper.accessor('dailyRate', {
      id: 'dailyRate',
      header: m.table_colDailyRate(),
      cell: ({ getValue }) => {
        const dailyRate = getValue()

        return (
          <span
            className={cn(
              'font-semibold tabular-nums',
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
        if (!stage) return <span className="text-muted-foreground">—</span>
        return <StageBadge name={stage.name} color={stage.color} />
      }
    }),
    columnHelper.accessor('location', {
      id: 'location',
      header: m.table_colLocation(),
      cell: ({ getValue }) => <span className="truncate">{formatValue(getValue())}</span>
    }),
    columnHelper.display({
      id: ACTIONS_COLUMN_ID,
      cell: ({ row }) => (
        <OpportunityRowActions
          row={row.original}
          onEdit={() => onEdit(row.original)}
          onToggleArchive={() => onToggleArchive(row.original)}
          onDelete={() => onDelete(row.original)}
        />
      )
    })
  ])

  // Pinning is a permanent lead sort, so pinned rows stay on top of any column sort.
  const sortingWithPin = [PIN_SORT, ...sorting]

  // Served, not requested: paging from a clamped `?page=999` moves relative to what is shown.
  const servedPagination = { pageIndex: servedPage - 1, pageSize: pagination.pageSize }

  // The accessor key is not the id: only an explicit `id` lands on the column def, which is what
  // both the visibility filter and the track lookup match on.
  const visibleColumns = columns.filter(
    (column) => !hiddenColumns.some((hidden) => hidden === column.id)
  )

  const table = useTable({
    features: tableModuleFeatures,
    data: rows,
    columns: visibleColumns,
    state: { sorting: sortingWithPin, pagination: servedPagination },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sortingWithPin) : updater
      setSorting(next.filter((entry) => entry.id !== PIN_SORT.id))
    },
    onPaginationChange: (updater) =>
      setPagination(typeof updater === 'function' ? updater(servedPagination) : updater),
    getRowId: (row) => row.id,
    enableSortingRemoval: false,
    manualSorting: true,
    manualPagination: true,
    rowCount: total,
    pageCount
  })

  return (
    <>
      <DataTable
        table={table}
        gridTemplate={GRID_TEMPLATE_CLASS}
        gridTracks={gridTracks(visibleColumns.map((column) => column.id ?? ''))}
        isFetching={isFetching}
        emptyTitle={emptyTitle}
        emptyHint={emptyHint}
        silentColumns={{
          [PIN_COLUMN_ID]: m.table_colPinned(),
          [ACTIONS_COLUMN_ID]: m.table_rowActions()
        }}
        cellClassName={cellClassName}
        rowClassName={(row) => (row.isPinned ? 'bg-accent/35' : undefined)}
        onRowClick={onEdit}
        rowActionLabel={(row) => m.table_editRow({ recruiter: row.recruiter })}
        caption={m.table_caption()}
      />
      <DataTablePagination table={table} pageSizes={PAGE_SIZES} labels={paginationLabels} />
    </>
  )
}
