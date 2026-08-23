# Customization ("Personnaliser")

The `/app/customize` page is where the user reshapes their own pipeline: stage names, colors,
order, follow-up delays, plus the job types and experience levels the opportunity form offers,
and the reference day rate that colors every rate in the table.

The data model behind it — per-user tables rather than enums — is
[ADR 0001](../decisions/0001-user-configurable-pipeline.md). This file covers how the page
behaves and why.

## Text commits on blur, everything else is instant

| Control                                    | Writes when           |
| ------------------------------------------ | --------------------- |
| Stage name, item name, delay, day rate     | blur, or Enter        |
| Color swatch, ↑↓ reorder, archive, restore | immediately, on click |

The design footer promises "Les modifications s'appliquent en direct", and the controls that
_look_ live are. Text is the exception, for two reasons:

- **A stage name fans out.** It renders in the sidebar, in every table badge and in the filters.
  A debounced autosave fires mid-word, so "Entretien tech" would publish "Entret", then
  "Entretien t", each one invalidating the queries and flickering three surfaces.
- **It removes a reorder race.** With autosave, an in-flight rename can still be pending when
  the user clicks ↑; the reorder response lands first and the late rename overwrites it. Blur
  closes that window — the field commits before the click registers.

`CommittedInput` and `CommittedNumberInput` implement the contract: local draft state, commit on
blur and Enter, revert on Escape. When the server value changes underneath (a rejected write
rolling back, or an edit from another tab) the draft resyncs **during render**, comparing the
prop against a `useState`-held previous value — not in a `useEffect`. Same reasoning as the
opportunity sheet's row-switch reset, in [forms.md](forms.md). An empty name reverts rather than
committing — the server would reject it anyway, and reverting says so faster.

## The delay drives the follow-up queue

`stages.reminder_delay_days` is not display data. It feeds `dueDate` in
[`opportunities-sql.ts`](../../src/modules/opportunities/opportunities-sql.ts), which defines
`isDueExpression` — so editing a delay retroactively changes which opportunities are "à relancer
aujourd'hui", the sidebar counter and the KPI band.

A delay edit therefore invalidates `['opportunities']` alongside `['stages']`, and so does
archiving a stage — `isArchivedRow` ORs the stage's flag onto each of its opportunities, moving
them all between the active and archived tabs. The other writes stay narrow: a rename, a recolor,
a create, a reorder or a delete change nothing an opportunity query returns, so they invalidate
`['stages']` and the counts key only. Reaching the counts through their `['opportunities']` prefix
would have refetched the whole table to refresh a per-stage number.

The same split applies to job types and levels, where it is simpler: the opportunities query stores
the foreign key and never joins the name, so only a delete — which nulls that key — touches rows.

## Deleting: two different rules, deliberately

The FK delete policies from ADR 0001 give the two lists opposite behaviour, and the UI states
each one rather than hiding it:

- **A stage is `ON DELETE RESTRICT`.** `deleteStage` counts the opportunities first and throws
  `CONFLICT` when the stage is not empty. Letting Postgres raise the FK error instead would
  surface as an unreadable server crash. The panel answers `CONFLICT` with a dialog that offers
  **archiving** — the stage leaves the active kanban and loses nothing.
- **A job type or level is `ON DELETE SET NULL`.** Deleting is never blocked; the opportunities
  survive with that one field cleared. The confirmation dialog says exactly that, and an unused
  item (count 0) skips the dialog entirely.

A stage carrying a `system_key` cannot be deleted at all: `deleteStage` throws
`STAGE_SYSTEM_LOCKED`, and the row menu hides its delete entry rather than offering an action that
can only fail. Archiving stays available — it is how a system stage leaves the kanban.

The counts shown on each row exist for these dialogs. They are deliberately not rendered as a
standing warning under every row: an alarm for a deletion nobody requested reads as a problem
with the page.

## Reorder writes the whole list

`reorderStages`, `reorderJobTypes` and `reorderExperienceLevels` take the full ordered id array,
not a moved pair. One write settles every position, so two reorders cannot interleave into a
gapped or duplicated sequence. Each handler verifies every id belongs to the caller before the
first position moves.

For stages, only the active ones are reorderable. Archived stages sit outside the kanban where
order carries meaning, so `reorderStages` sorts them after the active ones (`orderActiveFirst`)
rather than trusting the order the client sent. `setStageArchived` then re-appends a stage on
restore instead of leaving it on the position it held when archived — otherwise a restored stage
reappears in the middle of the pipeline, wherever a later reorder happened to renumber it.

## Reordering: drag, or the row menu

Each list is reorderable by dragging its grip or through the reorder entries in the row menu, and
every move is announced to screen readers. All of it — the wiring, the grip, the menu entries, the
announcer — lives in `src/shared/sortable/`, which knows nothing about stages or job types.
See [sortable-mechanism.md](sortable-mechanism.md).

What this page supplies is the list id, the items and the commit handler. For stages that commit
appends the archived ones, since `reorderStages` takes the whole list.

## Writes land before the round-trip

Every list mutation is optimistic — create, rename, recolor, delay, archive, reorder and delete.
`optimisticList` and `rollbackList` (`src/lib/optimistic.ts`) hold the shared shape: cancel any
in-flight refetch so it cannot land on top of the write, snapshot the list, apply the change, and
restore the snapshot if the server refuses.

Two cases are subtler than the rest:

- **Create** invents a client-side id so the row has a React key before the server assigns one,
  and reproduces the server's own defaults — `nextPosition` and `nextFreeStageColor` — so the row
  does not change place or colour when the real one arrives. `onSuccess` swaps the placeholder in
  place rather than waiting for the invalidation, which would otherwise blink.
- **Delete** rolls back _before_ running `onConflict`. A stage that still holds opportunities
  comes back on screen first, so the blocked dialog names a row the user can actually see.

Rows animate in and out through `AnimatedList` (`src/components/animated-list.tsx`). The rows
carry their own bottom spacing instead of sitting in a flex `gap`: a gap cannot be animated per
child, so an exiting row would hold its gap open until unmount and the list would snap shut a
frame late. Both components fall back to no animation under `prefers-reduced-motion`.

## Two tables, two modules, all the way up

`job_types` and `experience_levels` are two tables, so they stay two modules, and each owns its
whole stack — `-schema.ts`, `-server.ts`, `hooks/`, and `components/`. The CRUD, the row, the card
and the mutations hook are written out in both rather than factored into one parameterised
component. The duplication is deliberate: it is the price of every module following the same file
convention with nothing stranded outside `src/modules/`. Earlier attempts at a shared
`config-items` module, then a split between `src/db/` and `src/lib/`, were both worse.

An intermediate version did factor the UI into a `job-profile` module — `ListCard`, `ListItemRow`,
a `JobProfileApi` contract, and a shared `getJobProfileCounts`. It collapsed under its own
generality: a component serving both tables can name neither, so its type was `Item = { id, name }`
and five of its eleven props existed only to inject the labels it had no business not knowing.
Generic names like `ListCard` were the symptom; the shared component was the cause.

What stayed shared is what carries no domain at all: `ConfirmDeleteDialog` in `components/ui/`
(title and description in, confirm out) and `CustomizationCard` / `CommittedInput`, which the stage
card uses too.

Each module answers its own counts (`getJobTypeCounts`, `getExperienceLevelCounts`). Two endpoints
rather than one costs no latency: React Query fires them together and they overlap on the same
connection, so the page waits for the slower one — which is what a combined endpoint would have
waited for anyway, running both queries before it could answer. What a combined endpoint would
cost is a home: it cannot live in either `-server.ts` without the other importing across the
bundler boundary, so it needs a third module to host it. That module was `job-profile`, and hosting
shared code is not a domain. Only the delete dialogs read the counts.

An earlier version put the count helpers in the two `-server.ts` files and imported them from a
third. That leaves the page hanging on its skeleton with no error — TanStack Start strips
`-server.ts` from the client bundle, and an import across that boundary breaks at runtime. See the
bundler-boundary note in CLAUDE.md.

## Why the counts are not in a `-sql.ts`

Each module's count query sits in its own `-server.ts`, inside the endpoint that uses it, rather
than in a `-sql.ts` mirroring `opportunities-sql.ts`. The two cases look alike and are not:

- `opportunities-sql.ts` imports only `@/db/schema` — column definitions, no connection — and
  exports _fragments_ (`isArchivedRow`, `isDueExpression`) composed by two different servers.
  Being connection-free is what lets anything import it safely.
- A count query calls `db.select()`, so it pulls in `@/db/client`. A file named `-sql.ts` that
  carries the DB connection invites an import from a component: it would typecheck and fail at
  runtime.

The rule: `-sql.ts` is for connection-free fragments shared by more than one server. A finished
query with a single caller belongs beside that caller.

## Three modules, not one

The Personnaliser page spans three modules, split by what owns the data rather than by what renders
together:

- `job-types/` and `experience-levels/` — one per table, each with its own schema, server, hooks
  and components, down to the card and the row.
- `customization/` — the daily-rate reference, the stages, and the page shell itself.

The two list modules reach into `customization/components/` for `CustomizationCard` and
`CommittedInput`. Both are used by the stage cards too, so they stay where the page owns them
rather than moving into one of its tenants.

Every skeleton lives beside the component it stands in for — `JobTypeRowSkeleton` in
`job-type-row.tsx`, `CustomizationPanelSkeleton` in `customization-panel.tsx`. A placeholder in a
file of its own drifts silently: a padding change on the real row shows up as a reflow on load,
never as a failing check.

## Each card loads and fails on its own

The panel is layout only. Every card sits behind a `QueryGate` holding the queries that card
needs, so one slow or failing section cannot gate the page: a broken `getJobTypes` leaves the day
rate, the stages and the levels rendered, and puts a single retry button where its own card was.
That retry refetches only the queries that failed, not the five that succeeded.

The loader and the gates cover two different windows, and both are needed.

The loader awaits the three queries the two cards above the fold need (day rate, stages, stage
counts) and only prefetches the four below. `pendingComponent` therefore holds
`CustomizationPanelSkeleton` over the whole page until those three land, so the page arrives in one
transition instead of four. An earlier version awaited nothing: the shell painted, then six card
skeletons, then each card popped in as its own query resolved — correct, and visibly unsettled.

Awaiting everything instead would put the slowest of the six in charge of the whole page, which is
what the gates exist to prevent. Awaiting nothing gives up the single transition. The split keeps
both.

The gates stay useful after that first paint, and the reason is **failed refetches**, not first
loads. The loader owns the initial fetch: if one of its three queries throws, `errorComponent`
takes the whole page and the gates are never reached. But the loader runs once, while the page
lives on — and every stage or day-rate mutation invalidates these keys. A refetch that fails then
leaves the query `isError: true` **with its stale `data` still in cache**. Without a gate, the card
would go on rendering that stale value with nothing saying the sync is broken. The gate turns it
into a retry in place, leaving the other cards alone.

Cache eviction is the same shape, one step further along: past `gcTime` the data is gone and the
gate holds its skeleton rather than rendering against `undefined`.

An earlier version of this file claimed the midnight `queryKey` change (`stage-counts` is keyed on
`today`) was the reason to keep the gates. Measured, it is not: evicting the entry does not reclose
the gate, because nothing re-renders the card. The refetch path above is the one that matters.

A gate holds its skeleton until **every** query it lists has resolved, so a card is never rendered
against a half-loaded value.

Every skeleton mirrors the real row heights (sized from `DEFAULT_STAGES`, `DEFAULT_JOB_TYPES` and
`DEFAULT_EXPERIENCE_LEVELS`) so nothing reflows when the data arrives.

## The panel scrolls in a container, and does not restore its position

`AppShell` is `h-svh` with `overflow-hidden`, so the window never scrolls: a page taller than the
viewport has to scroll inside its own container, which is the scrolling `div` `CustomizationPanel`
opens with. It stayed a plain element rather than becoming a component — it carries no behaviour to
name.

The router's `scrollRestoration` only covers the window, so restoring an inner element means owning
it — and owning it here means fighting the loading sequence: the skeleton paints first and is
shorter than the cards, so any offset applied to it gets clamped and then corrected when the real
content lands. That is a visible two-stage jump, which is worse than simply starting at the top. An
earlier attempt at sessionStorage plus scroll listeners produced exactly that, and was removed.

So a reload returns to the top. If that becomes a real annoyance, the fix is not more restore
logic here — it is deciding whether the dashboard shell should let the window scroll at all, which
is a change for every page, not just this one.
