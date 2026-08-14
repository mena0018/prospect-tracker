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

- **`fetchUser`** (`src/modules/auth/auth-server.ts`) runs in the root `beforeLoad` on every
  SSR request. Read-only: it verifies the token with `getUser()` and exposes the
  identity — including a `provisioned` flag read from `user_metadata` — via router
  context.
- **`provisionUser`** creates the `users` row and copies the default pipeline
  (stages / job types / experience levels), then sets `provisioned: true` in the
  Supabase `user_metadata`. The `_authed` `beforeLoad` calls it only when
  `context.user.provisioned` is false, so it runs once per account rather than on
  every protected load. The flag is written **after** the DB transaction commits,
  so a failed provisioning is retried on the next load. It is an optimization
  only, never an access decision (that stays `getUser()`-verified), and lives in
  server-side `user_metadata` — not a client-forgeable cookie.
- Auth is re-checked **inside** every server function handler. Route guards
  (`beforeLoad`) protect the UI, not the data: server functions are independently
  reachable RPC endpoints.

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
  (`https://meetprospect-*-<scope>.vercel.app/api/auth/callback`). The
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
