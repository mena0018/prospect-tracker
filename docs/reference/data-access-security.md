# Data access security

Why user data is protected **twice**, and which mechanism covers which path.
Read this before adding a server function that reads or writes user-owned rows.

## Two doors into the same tables

Supabase hosts the Postgres database, so our tables are reachable through two
independent paths — and they do not share a protection mechanism.

| Path                                                              | Reaches Postgres as    | RLS applies? | What protects it                                |
| ----------------------------------------------------------------- | ---------------------- | ------------ | ----------------------------------------------- |
| **Drizzle** ([`src/db/client.ts`](../../src/db/client.ts))        | service role           | ❌ bypassed  | the `user_id` predicate in every query          |
| **Supabase API** (PostgREST, Realtime, Storage — public endpoint) | `authenticated`/`anon` | ✅ enforced  | the policies in `drizzle/0001_rls_policies.sql` |

The second row is the one that surprises people: **Supabase exposes a public REST
API over your tables**. That endpoint exists whether or not our app calls it, and
it is reachable with the publishable (anon) key that ships in the browser bundle.
Nothing in our TanStack code guards it. Only RLS does.

So the two are not redundant — they cover different surfaces:

- Drop the `user_id` predicate → our own server functions leak across users.
- Drop RLS → the public Supabase API leaks everything, even if our code is perfect.

## Path 1 — Drizzle (our server functions)

`src/db/client.ts` connects straight to Postgres with `DATABASE_URL`, i.e. the
service role. Postgres does **not** evaluate RLS policies for that role, so the
policies in `0001_rls_policies.sql` never run on these queries. This is
intentional (server-side code needs to read across users for crons and admin
work), not something to "fix".

Consequently, ownership is enforced in the query itself:

```ts
const { id: userId } = await requireUser()

await db
  .update(opportunities)
  .set({ ...fields, updatedAt: new Date() })
  .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
```

Two things make this safe:

1. **`userId` comes from the verified session**, never from the client payload
   (`requireUser()` in [`src/lib/supabase/server.ts`](../../src/lib/supabase/server.ts)
   calls `supabase.auth.getUser()`, which validates the JWT server-side). Zod
   schemas deliberately omit `user_id`, so a client that sends one has it
   stripped. This path keeps the Auth-server round-trip on purpose even though the
   route guard now verifies locally — see [`auth.md`](auth.md).
2. **It filters rather than checks.** Rows belonging to other users are invisible
   to the query, so there is no "is this mine?" branch that could be forgotten or
   get the comparison backwards.

> **Rule:** every Drizzle query touching a user-owned table carries
> `eq(table.userId, userId)`. There is no second line of defence on this path.

### Server functions are not covered by route guards

`createServerFn` compiles to a real HTTP endpoint. The `beforeLoad` guard in
`src/routes/_authed.tsx` runs on **navigation**, not on that endpoint — anyone can
POST to it directly. That is why every handler touching user data calls
`requireUser()` itself.

### Missing vs. not yours

When the predicate matches nothing, the handler reports `NOT_FOUND` — the same
answer for "no such row" and "someone else's row". Distinguishing them (say, a
`FORBIDDEN`) would confirm that a probed UUID belongs to a real record, letting an
attacker enumerate what exists without ever reading it.

## Path 2 — the public Supabase API (RLS)

`drizzle/0001_rls_policies.sql` enables RLS on every app table and grants access
to the `authenticated` role only, with one policy per operation. Predicates are
trivial because every table carries a direct owner column:

- `users`: `auth.uid() = id` (the row's id **is** the Supabase Auth UUID)
- everything else: `auth.uid() = user_id`

`INSERT`/`UPDATE` policies carry a `WITH CHECK` so a user cannot create a row
owned by someone else, nor move an existing row into another user's ownership.

The `anon` role is granted nothing, so an unauthenticated caller who finds the
project URL reads nothing.

## Keys

`VITE_SUPABASE_ANON_KEY` is RLS-gated and safe in the browser bundle (the
`VITE_` prefix ships it there by design).

`DATABASE_URL` is the service-role credential that bypasses RLS: server-only,
never imported from client code, never committed. Same for
`SUPABASE_SERVICE_ROLE_KEY` if one is ever added — leaking either removes the
protection described in Path 2 entirely.

## Checklist for a new domain module

- [ ] Table has a `user_id` FK to `users.id` (`on delete cascade`).
- [ ] A migration enables RLS and adds the four policies for it.
- [ ] Every `createServerFn` touching it calls `requireUser()`.
- [ ] Every query filters on `eq(table.userId, userId)`.
- [ ] The Zod schema has no `user_id` field — it comes from the session.

## See also

- [`auth.md`](auth.md) — sessions, cookies, the two Supabase clients
- [`data-model.md`](data-model.md) — tables and relations
- [CLAUDE.md](../../CLAUDE.md) — the short form of these rules
