# The table module

`src/modules/table/` holds everything about tables that carries **no domain knowledge**:
URL-backed sorting and paging, the TanStack Table feature set, and the rendering shell.
A domain module supplies its columns, its own filters and its labels — nothing else.

The split is deliberate: `opportunities/` should read as "what an opportunity row looks
like", not as table plumbing.

## What lives where

| Concern                                    | Table module                           | Domain module                   |
| ------------------------------------------ | -------------------------------------- | ------------------------------- |
| `sort` / `page` / `perPage` in the URL     | `table-schema.ts`                      | —                               |
| Own filters (`tab`, `q`, `due`…)           | —                                      | `<domain>-schema.ts`            |
| `column:direction` codec, page ↔ pageIndex | `table-utils.ts`                       | —                               |
| Registered features and sort fns           | `table-features.ts`                    | —                               |
| Table markup, sorting header, empty state  | `components/data-table.tsx`            | —                               |
| Pagination controls                        | `components/data-table-pagination.tsx` | —                               |
| Columns, cells, row styling                | —                                      | `components/<domain>-table.tsx` |
| Message keys                               | —                                      | passed in as props              |

The module owns **no i18n keys**. `DataTablePagination` takes a `labels` object and
`DataTable` takes `caption`, `emptyTitle` and `emptyHint`, so a second table can be worded
differently without touching shared code.

## Adding a second table

1. Compose the search schema — own filters plus the shared slice:

   ```ts
   export const remindersSearchSchema = z.object({
     status: z.enum(['pending', 'sent']).catch('pending'),
     ...tableSearchSchema({ sortColumns: SORT_COLUMNS, pageSizes: PAGE_SIZES, defaultPerPage: 10 })
       .shape
   })
   ```

2. Wire the route with `validateSearch` and `stripSearchParams(DEFAULTS)`.
3. Write a filters hook that calls `useTableSearch` and adds the domain setters.
4. Define columns with `createColumnHelper<typeof tableModuleFeatures, Row>()`.
5. Render `<DataTable>` + `<DataTablePagination>`, passing a grid template and labels.

## Why `useTableSearch` takes `search` and `onSearchChange`

TanStack Router types `useSearch` and `useNavigate` against a **literal route id**. A
wrapper hook cannot carry that literal through its own generic without erasing the route
union, so the hook takes the already-typed search object and a navigation callback. The
caller keeps full type safety; the module keeps the sort/page logic.

## Why the markup is a real `<table>`

It was a grid of `<div>`s. That renders identically but tells assistive technology
nothing: no table announcement, no row/column navigation, no sort state.

The elements now carry `display: grid` so a single `grid-template-columns` still drives
every column width — `<thead>`, `<tbody>` and each `<tr>` are grid containers. What this
buys, and what the `<div>` version could not express:

- `<th scope="col">` associates every cell with its column header.
- `aria-sort` reports the sorted column and its direction.
- `<caption class="sr-only">` names the table.
- The empty state is a single `colspan` cell rather than a sibling `<div>`.

Header and body are **one** `<table>`. An earlier version split them into two so the
header could stay fixed; that announced two unrelated tables and detached the headers from
their cells. The header is now `position: sticky` inside the single scroll container
instead.

Columns with no visible label (the pin toggle) still render a `<th>` carrying an
`sr-only` label. Skipping the cell would collapse its grid track and shift every following
header out of line with its column.

## Related

- Server-side filtering, sorting, paging: [`server-side-table.md`](server-side-table.md)
