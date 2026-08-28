import { createColumnHelper, useTable } from '@tanstack/react-table'

import { m } from '@/i18n/paraglide/messages'
import { cn, formatDate, formatValue } from '@/lib/utils'
import { ContactIdentity } from '@/modules/contacts/components/contact-identity'
import { ContactRowActions } from '@/modules/contacts/components/contact-row-actions'
import { RelationshipBadge } from '@/modules/contacts/components/relationship-badge'
import { CONTACTS_PAGE_SIZES } from '@/modules/contacts/contacts-schema'
import { useContactsFilters } from '@/modules/contacts/hooks/use-contacts-filters'
import { contactDisplayName } from '@/modules/contacts/utils/display'
import type { ContactListRow } from '@/modules/contacts/contacts-server'
import { DataTable } from '@/shared/table/components/data-table'
import { DataTablePagination } from '@/shared/table/components/data-table-pagination'
import { tableModuleFeatures } from '@/shared/table/table-features'

export const CONTACTS_GRID_TEMPLATE =
  'grid-cols-[minmax(180px,1.4fr)_minmax(130px,1fr)_minmax(150px,0.9fr)_140px_110px_44px]'

export const CONTACTS_COLUMN_COUNT = 5

const ACTIONS_COLUMN_ID = 'actions'

const columnHelper = createColumnHelper<typeof tableModuleFeatures, ContactListRow>()

const cellClassName = (columnId: string) =>
  columnId === ACTIONS_COLUMN_ID
    ? 'justify-center px-0'
    : columnId === 'opportunities'
      ? 'justify-end'
      : undefined

type Props = {
  rows: ContactListRow[]
  total: number
  // Clamped server-side, so it can differ from `?page=`. See docs/reference/server-side-table.md
  servedPage: number
  pageCount: number
  isFetching: boolean
  onOpen: (row: ContactListRow) => void
  onEdit: (row: ContactListRow) => void
  onDelete: (row: ContactListRow) => void
  emptyTitle: string
  emptyHint: string
}

export function ContactsTable({
  rows,
  total,
  servedPage,
  pageCount,
  isFetching,
  onOpen,
  onEdit,
  onDelete,
  emptyTitle,
  emptyHint
}: Props) {
  const { sorting, pagination, setSorting, setPagination } = useContactsFilters()

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
    columnHelper.accessor((row) => row.lastName ?? row.firstName ?? row.company, {
      id: 'name',
      header: m.contact_colName(),
      cell: ({ row }) => <ContactIdentity contact={row.original} showSubtitle={false} />
    }),
    columnHelper.accessor('company', {
      header: m.contact_colCompany(),
      cell: ({ getValue }) => <span className="truncate">{formatValue(getValue())}</span>
    }),
    columnHelper.accessor('relationship', {
      header: m.contact_colRelationship(),
      cell: ({ getValue }) => <RelationshipBadge relationship={getValue()} />
    }),
    columnHelper.accessor('lastExchange', {
      header: m.contact_colLastExchange(),
      cell: ({ getValue }) => {
        const value = getValue()

        return (
          <span className={cn('tabular-nums', !value && 'text-muted-foreground')}>
            {value ? formatDate(value) : m.contact_neverContacted()}
          </span>
        )
      }
    }),
    columnHelper.accessor('opportunityCount', {
      id: 'opportunities',
      header: m.contact_colOpportunities(),
      cell: ({ getValue }) => <span className="font-semibold tabular-nums">{getValue()}</span>
    }),
    columnHelper.display({
      id: ACTIONS_COLUMN_ID,
      cell: ({ row }) => (
        <ContactRowActions
          onEdit={() => onEdit(row.original)}
          onDelete={() => onDelete(row.original)}
        />
      )
    })
  ])

  // Served, not requested: paging from a clamped `?page=999` moves relative to what is shown.
  const servedPagination = { pageIndex: servedPage - 1, pageSize: pagination.pageSize }

  const table = useTable({
    features: tableModuleFeatures,
    data: rows,
    columns,
    state: { sorting, pagination: servedPagination },
    onSortingChange: (updater) =>
      setSorting(typeof updater === 'function' ? updater(sorting) : updater),
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
        gridTemplate={CONTACTS_GRID_TEMPLATE}
        isFetching={isFetching}
        emptyTitle={emptyTitle}
        emptyHint={emptyHint}
        silentColumns={{ [ACTIONS_COLUMN_ID]: m.contact_rowActions() }}
        cellClassName={cellClassName}
        // The row opens the record, where the opportunities they brought are listed; editing
        // is one click further, in the row menu.
        onRowClick={onOpen}
        rowActionLabel={(row) => m.contact_openRow({ name: contactDisplayName(row) })}
        caption={m.contact_caption()}
      />
      <DataTablePagination
        table={table}
        pageSizes={CONTACTS_PAGE_SIZES}
        labels={paginationLabels}
      />
    </>
  )
}
