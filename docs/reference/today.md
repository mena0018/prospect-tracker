# The current day

`useToday()` (`src/hooks/use-today.ts`) returns today's date as `YYYY-MM-DD`, resolved in the
browser and re-published when the day changes under an open tab.

Every follow-up rule is relative to a day — see [`kpis.md`](kpis.md) for _why_ that day comes
from the browser rather than the server, and [`data-model.md`](data-model.md) for the
"à relancer" rule itself. This file covers how the hook works.

## A shared store, not per-component state

The date lives in a module-level store read through `useSyncExternalStore`, so every consumer
shares **one** timer and one listener. Three components calling `useToday()` do not schedule
three midnight wake-ups.

The value feeds React Query keys, so a new day changes the keys and the queries refetch on
their own. Nothing has to invalidate anything by hand.

## Why not a `staleTime`

The obvious-looking fix — a short `staleTime` so the queries refetch periodically — does not
work, and the reason is worth keeping.

`staleTime` refreshes **the data**, not **the date**. The date was a module constant evaluated
once at import; no React Query setting touches it. So every refetch would send the same stale
`today` and get back correct data about the wrong day, forever, at the cost of one request per
interval per tab — for an event that happens once a day.

## Scheduling the next midnight

```ts
const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
```

Three things make this hold:

- **`new Date(y, m, d)` with no time is local midnight**, which is the same day boundary
  `todayIso()` reports. A UTC midnight would flip the date at the wrong moment for anyone not
  on UTC.
- **`getDate() + 1` may read 32.** That is not a bug to guard against: the constructor
  normalises overflow, so 32 January becomes 1 February and a 13th month becomes January of the
  next year. No end-of-month or end-of-year special case is needed.
- **A DST day is not 24 hours.** The delay is a difference between two absolute timestamps
  (`getTime()`), so the 23-hour spring day and the 25-hour autumn one both come out right.

The timer fires **one second past** midnight. Rounding can otherwise wake it a few milliseconds
early, where it would read the same day, publish nothing and reschedule — a harmless but
pointless extra cycle.

## Why `visibilitychange` as well

Browsers throttle timers in a backgrounded tab, and a laptop that sleeps suspends them
entirely, so the midnight wake-up alone cannot be relied on. The listener re-checks the day
whenever the tab becomes visible again, which covers the case of an app left open overnight and
returned to in the morning.

Both paths go through the same `publishIfDayChanged()`, which compares against the stored value
and notifies only on a real change — so the redundancy never causes a double refetch.

## SSR

`getServerSnapshot` returns the same string as the client snapshot. The server has no access to
the user's timezone, so it cannot know their day; rendering a different value than the client
would be a hydration mismatch. The first client-side `subscribe` corrects the value if the two
ever disagree.

## Not covered by tests

Nothing here is tested yet. The store needs a DOM — the subscription, the timer and the
`visibilitychange` listener — and the Vitest environment is `node` with no `jsdom` or
`happy-dom` installed, so covering it means adding that environment first.

`todayIso()` and `msUntilNextMidnight()` are pure, so they are the cheap part to cover with fake
timers once there is a reason to export them — the cases worth pinning are the month, year and
leap-day rollovers and the DST eve, since those are what the `getDate() + 1` overflow above
relies on.
