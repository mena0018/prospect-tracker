# Auth (Supabase SSR)

How authentication works in the app. Reference for DEV-18 and anything that
touches sessions, cookies, or the `users` row. Implementation lives in
`src/lib/supabase/` and `src/modules/auth/auth-server.ts`.

## Model

Supabase Auth owns credentials in `auth.users` (id = UUID). Our `users` table
does **not** re-implement auth — it references that UUID as its primary key (see
[User identity](../../CLAUDE.md) and [`data-model.md`](data-model.md)). Sessions are carried in
HTTP cookies, kept in sync between a server client and a browser client.

> **Deletes cascade; edits don't sync.** `public.users.id` has a FK to
> `auth.users.id` with `ON DELETE CASCADE` (migration `0002`). So:
>
> - **Deleting a user**: deleting the `auth.users` row (Supabase dashboard / Auth
>   admin) automatically removes the `public.users` row, which in turn cascades to
>   its app data (`stages`, `job_types`, `experience_levels`, `opportunities`).
>   Nothing manual to do.
> - **Editing identity fields** (email, name, …): **not** synced — the app only
>   writes `public.users` at provisioning and never mirrors later edits made
>   directly in the Supabase dashboard. Update both sides by hand if needed.

## Two Supabase clients

| Client  | File                         | Runs                                                  | Uses                                       |
| ------- | ---------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| Server  | `src/lib/supabase/server.ts` | SSR request context (`createServerFn`, server routes) | session read/verify, cookie write          |
| Browser | `src/lib/supabase/client.ts` | Browser bundle                                        | client-initiated OAuth redirect, `signOut` |

Both use the **public** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (anon key
is RLS-gated, safe to ship to the browser). The service-role key is never used
here and must never be `VITE_`-prefixed.

## Session resolution & provisioning

- **`fetchUser`** (`src/modules/auth/auth-server.ts`) runs in the root `beforeLoad`. Read-only:
  it verifies the token with `getClaims()` and exposes the identity — including a `provisioned`
  flag read from `user_metadata` — via router context. Why `getClaims()` and not `getUser()`:
  see below.
- **`provisionUser`** creates the `users` row and copies the default pipeline
  (stages / job types / experience levels), then sets `provisioned: true` in the
  Supabase `user_metadata`. The `_authed` `beforeLoad` calls it only when
  `context.user.provisioned` is false, so it runs once per account rather than on
  every protected load. The flag is written **after** the DB transaction commits,
  so a failed provisioning is retried on the next load. It is an optimization
  only, never an access decision (that stays signature-verified), and lives in
  server-side `user_metadata` — not a client-forgeable cookie.

  It then calls **`refreshSession()`**. `updateUser` writes the metadata but does not reissue
  the access token, and `fetchUser` reads the flag out of the JWT's claims — so without the
  refresh the token would keep carrying `provisioned: false` until it expired (an hour by
  default), and every navigation in between would call `provisionUser` again. The transaction
  is idempotent (`if (existing) return existing`), so this was never a correctness problem —
  it was a wasted DB round-trip per navigation, which is exactly what the `getClaims()` switch
  set out to remove.

- Auth is re-checked **inside** every server function handler. Route guards
  (`beforeLoad`) protect the UI, not the data: server functions are independently
  reachable RPC endpoints.

## Why `getClaims()` and not `getUser()`

`fetchUser` runs in the **root** `beforeLoad`, and `beforeLoad` is not cached. TanStack Router
re-runs it on every navigation — including every debounced keystroke in the table's search box —
and the router's own internals doc is explicit that it "is not a cache mechanism". `staleTime`
does not apply: that is a **loader** option, and the loader path is the only one that consults
staleness. So whatever `fetchUser` does, it does once per navigation.

With `getUser()` that meant an HTTP round-trip to `/auth/v1/user` each time — a median of 71 ms,
against 3 ms once verified locally (dev-local, same machine and session, so treat the ratio as
the result rather than the absolute numbers).

`getClaims()` removes the round-trip **without weakening the check**, because this project uses
asymmetric JWT signing keys:

```
GET https://<project>.supabase.co/auth/v1/.well-known/jwks.json
→ {"alg":"ES256","kty":"EC","use":"sig", ...}
```

With an asymmetric algorithm, `getClaims()` verifies the JWT signature locally via WebCrypto.
A forged or tampered cookie fails that verification exactly as it would fail server-side — this
is a real cryptographic check, **not** a cache of a previous answer and not a decode-and-trust.
The public key is fetched from the JWKS endpoint and held in a module-global cache with a
10-minute TTL, so the network cost is amortised across requests on a warm server rather than
paid per navigation.

### What would silently undo this

Two project-level changes turn `getClaims()` back into a per-call round-trip, and **neither
breaks anything visibly** — the app stays correct and secure, it just quietly gets slower:

- **Switching back to the legacy symmetric JWT secret.** `getClaims()` sees an `HS*` algorithm
  and falls back to `getUser()` internally.
- **Running where WebCrypto is unavailable.** Same fallback.

If the search path ever feels sluggish again, check the signing key type before anything else.

### What did not change

`requireUser()` still calls `getUser()`, and that is deliberate. Server functions are
independently reachable RPC endpoints — they are the real security boundary, not the route
guards — and they run once per mutation rather than once per keystroke. A verified round-trip
is worth it there.

## Flows

- **Email/password**: `signInWithPassword` / `signUpWithPassword` server
  functions set the session cookies on the SSR response, then the client
  invalidates the router and navigates to `/app`.
- **Google OAuth**: the browser client calls `signInWithOAuth` with a
  `redirectTo` of `/api/auth/callback?next=<dest>` (`next` preserves the
  post-login destination, from `?redirect=` set by the `_authed` guard). Supabase
  redirects to Google, then back to that callback, which exchanges the code for a
  session (`exchangeCodeForSession`) and redirects to `next` (default `/app`).
  Every callback origin must be registered in Supabase → Auth → URL Configuration:
  `localhost`, the stable prod domain, and a **wildcard** for Vercel previews
  (`https://prospect-tracker-*-<scope>.vercel.app/api/auth/callback`). The
  wildcard also matters because the `?next=` query string means the `redirectTo`
  never equals a bare allow-list entry — a wildcard entry is what makes it match;
  otherwise Supabase silently falls back to the Site URL.
- **Logout**: browser `signOut`, then `GET /api/auth/logout` clears the server
  cookies and redirects to `/login`.

## Why the server client sets no-cache headers

In `server.ts`, the `setAll` cookie callback also copies a set of response
headers that `@supabase/ssr` hands it:

```
Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0
Expires: 0
Pragma: no-cache
```

The response being built **contains a session cookie** (the just-written auth
token). If a CDN or proxy (Vercel Edge, Cloudflare…) cached that response, it
could serve one user's session cookie to another — a cross-user session leak.
These headers forbid caching the response. Supabase provides them as the second
argument to `setAll`; our job is only to apply them to the outgoing response.

See `getSupabaseServerClient` in `src/lib/supabase/server.ts`.

## Why the post-login redirect is validated

`/login` accepts a `redirect` search param, forwarded to the OAuth callback as
`?next=`. It travels through the URL, so it is attacker-controlled: a link like
`/login?redirect=https://evil.com` reaches the callback untouched.

The callback builds its response with `new URL(next, url.origin)`. An **absolute**
target overrides the base entirely, so `next=https://evil.com` resolves to
`https://evil.com` — an open redirect that fires _after_ the session cookies are
set. The Supabase redirect allowlist does not catch this: the URL Supabase sees
is our own `/api/auth/callback`, and the off-origin hop is the second one, made
by our code.

`toSafeRedirect` (`src/modules/auth/auth-utils.ts`) keeps only same-origin
relative paths. Three shapes are rejected:

- absolute URLs (`https://evil.com`) and non-http schemes (`javascript:`)
- protocol-relative URLs (`//evil.com`) — `new URL()` resolves these off-origin
- backslash authorities (`/\evil.com`) — browsers normalise `\` to `/`

It is applied twice, on both paths the value can take:

- **server** — in `src/routes/api/auth.$.tsx`, before the callback redirect. This
  is the one that matters: it runs with a valid session in hand.
- **client** — as a `transform` on `redirect` in `loginSearchSchema`, so every
  `router.navigate({ to: next })` and the `beforeLoad` of `/login` get a
  sanitised value without repeating the guard at each call site.
