# 4. Dashboard renders with `ssr: 'data-only'`

Date: 2026-08-06

## Status

Accepted

## Context

The dashboard threw `Hydration failed because the server rendered text...` on every load,
in both locales.

The route loader fetched only `sidebarOpen` and `dailyRateReference`. Opportunities and
stages came from React Query hooks (`useOpportunities`, `useStages`) that run on the client.
So the server rendered the real panel against an empty cache — the sidebar showed
`Relances 0 à relancer` — while the client rendered `10` once the queries resolved. React
cannot reconcile a text difference and throws.

Three options were on the table:

1. **Prefetch in the loader and let SSR render the panel.** Fixes hydration, but the server
   then waits on the database before emitting any HTML: no first paint until the query
   returns, and no skeleton.
2. **Keep client-side fetching and render a skeleton.** A skeleton alone does not fix
   anything — if the server renders the skeleton and the client renders data, that is still
   a mismatch.
3. **`ssr: 'data-only'`** — the framework's own answer, documented as Strategy 4 in the
   TanStack Start hydration-errors guide.

## Decision

Use `ssr: 'data-only'` on `/_authed/app`, combined with `ensureQueryData` in the loader.

The two work together, and neither is sufficient alone:

- **`ensureQueryData`** keeps the data fetch on the server and dehydrates it into the client
  cache, so the panel has its rows the moment it mounts. Dropping it would push the fetch
  back to the browser and lose SSR data loading.
- **`ssr: 'data-only'`** stops the server from rendering the panel component. The server
  emits the route's `pendingComponent` instead, so both sides render the same skeleton and
  hydration matches. Dropping it would bring the mismatch back.

`setupRouterSsrQueryIntegration` (`src/router.tsx`) already handles dehydration and
rehydration — no extra wiring is needed.

## Consequences

- First paint is the skeleton, not a blank page; data arrives without a client round-trip.
- **The app shell must live above this route.** `pendingComponent` has no loader data, so an
  `AppShell` rendered inside `/_authed/app` could not read the persisted `sidebar_state`
  cookie and fell back to `defaultOpen` — a user with a collapsed sidebar saw it expanded for
  the pending frame, then collapse when the real component swapped in. `SidebarProvider` seeds
  its state once via `useState(defaultOpen)`, so the swap only corrected itself because the
  provider was remounted, which is what made the flash visible.

  The shell therefore mounts in the `/_authed` layout route, which is fully SSR'd and reads
  the cookie in its own loader. It is never remounted across the pending/loaded boundary, so
  `defaultOpen` is read once with the correct value. Keep `AppShell` out of `/_authed/app` —
  putting it back reintroduces the flash.

- The panel's own `isPending` branch stays: it still covers client-side navigations and
  refetches.
