# Server-side table

The opportunities table filters, sorts and paginates **in SQL**. The client renders the
page it is handed and never reduces a row set itself.

Three rules follow from that, and most of the surprising code in the module is one of
them being enforced.

## 1. The URL is the view state

`tab`, `q`, `due`, `sort`, `page` and `perPage` live in the query string — nowhere else.
A filtered table survives a refresh, and any view is shareable as a link.

[`opportunitiesSearchSchema`](../../src/modules/opportunities/opportunities-schema.ts) is
the single entry point. Everything downstream reads a typed object, never a raw string.

Every field uses `.catch()` rather than `.default()`. `.default()` only fills in a
_missing_ param and **throws** on a malformed one, which surfaces as a route error rather
than a fallback. A hand-edited URL is expected input here, not an exception.

`sort` travels as `column:direction` and is normalised in the schema: an unknown column or
a malformed direction becomes `''`. Validating at the point of use instead would let the
bad value survive in the URL and travel through every subsequent navigation.

The route's `stripSearchParams` middleware then removes any param still equal to its
default on the way out, so an unfiltered table reads `/app` rather than
`/app?tab=active&page=1&…`.

`resetFilters` writes the defaults back for `q` and `due` only — the tab and the sort are
how the user is _looking_ at the table, not a filter narrowing it, so a reset leaves them
alone. Combined with the middleware above, one click takes a filtered view back to `/app`.

### The search box is debounced, so its value is not the URL's

Typing lives in a local draft inside
[`DebouncedInput`](../../src/components/ui/debounced-input.tsx) and reaches the URL once the
user pauses — otherwise every keystroke would be a navigation and a query.

That draft has to follow the URL back when something else changes it (the reset button,
a back navigation, a shared link). It does that **during render**, comparing against the
previous prop, rather than in an effect: an effect would fire again on our own debounced
emission and re-render the input a second time per search. `react-hooks/set-state-in-effect`
enforces this.

## 2. The server owns filtering, sorting and paging

[`listOpportunities`](../../src/modules/opportunities/opportunities-server.ts) applies the
tab, the `ILIKE` search, the due filter, the `ORDER BY` and the `LIMIT/OFFSET`, and returns
`{ rows, total, page }`.

TanStack Table therefore runs with `manualFiltering`, `manualSorting` and
`manualPagination` all set, plus `rowCount` for the totals. It is a rendering and
interaction layer only — its own row models would otherwise re-filter the single page it
was given and report totals for that page.

Sortable columns are a **whitelist** (`SORT_COLUMNS`), not a hint: the value reaches an
`ORDER BY`. The URL schema and the server's Zod enum both validate against it.

`isPinned` leads the `ORDER BY` unconditionally, so pinned rows stay on top of whatever
column sort is active.

## 3. The URL asks; the server decides; the table shows what was served

An out-of-range `?page=999` is **kept in the URL**. The server clamps it to the last page
holding rows and reports which page that was, via `OpportunitiesPage.page`. The table's
pagination state is built from that served value, not from the URL.

So the paging controls, the "page X of Y" label and the range label all describe the page
actually on screen, and paging from a clamped page moves relative to it.

Nothing rewrites the URL behind the user. An earlier version clamped in three places at
once — a `redirect()` in the route loader, the SQL `safePage`, and a `Math.min` at render —
with no single authority; that is why the route loader no longer counts rows, and why
`countOpportunities` is gone.

### What this costs

Landing on `?page=999` renders the last page while the URL still says 999. That is the
deliberate trade: the URL records what was requested, the view shows what exists.

### The client derives no pagination arithmetic

`listOpportunities` returns `{ rows, total, page, pageCount }`. `page` is the clamped page
and `pageCount` is the server's own `ceil(total / perPage)` — both feed TanStack Table
directly (`rowCount`, `pageCount`), so the client never recomputes a page count that the
server already decided. An earlier version returned only `total` and let the table derive
the rest, which duplicated the clamping rule on both sides.

### Why two queries and not one

The count runs alongside the page query in a `Promise.all`, on the optimistic assumption
that `?page=` is in range; only an out-of-range page pays for a second round trip.

Folding both into one query with `count(*) over()` was measured and rejected: the window
function forces Postgres to materialise every matching row before the `LIMIT`, which costs
the `top-N heapsort` and turns a bounded sort into a full sort of the filtered set.

## Why the loader carries no `loaderDeps`

The route loader fetches only what the table's own queries do not: the daily-rate
reference, and a warm React Query cache for the stages.

It declares no `loaderDeps`, so it never re-runs on a search-param change. Paging,
sorting and filtering are React Query's concern — a `loaderDeps` covering them would make
every paging click wait on the loader's server round-trips before React could re-render.

`ssr: 'data-only'` runs that loader on the server without rendering the dashboard's HTML.
The page is behind auth (no SEO value), and the due filter depends on the **browser's**
date — rendering it server-side would compute rows against the server's timezone and
hydrate into a mismatch. See [`kpis.md`](kpis.md) for why "today" always travels from the
client.

## Related

- Generic table plumbing and markup: [`table-module.md`](table-module.md)
- Follow-up and archive rules: [`data-model.md`](data-model.md)
- Aggregate cards: [`kpis.md`](kpis.md)
