# CLAUDE.md — ProspectTracker

Prospecting-tracker SaaS for freelancers, work-study students and job seekers.
Product reference: see `docs/PRD.md`.

**Language rule:** code, comments, identifiers and docs are **English**. Only end-user-facing
UI copy (tracker labels, buttons, follow-up emails) is in **French** — the target audience is
French freelancers.

The app and the landing page live in the **same TanStack Start app** (SSR): the LP is public
routes, the dashboard is protected routes. One repo, one deployment.

## Stack

TanStack Start (Router + SSR, Nitro runtime) · TanStack Query · TanStack Table · TypeScript
strict · Tailwind CSS v4 · shadcn/Radix UI · Supabase (Postgres) · Drizzle ORM (+ drizzle-kit)
· Supabase Auth (`@supabase/ssr`) · Resend · Stripe · PostHog · Vercel.

Locked decisions (don't revisit without a strong reason):

- **Framework = TanStack Start** — table-centric product + SSR landing page in one app.
- **Auth = Supabase Auth** (not Better Auth / Clerk) — shared with the Supabase DB.
- **ORM = Drizzle** (not Prisma) — lightweight, SQL-first, edge-friendly.
- **Lint = ESLint** (flat config, typescript-eslint + react-hooks), **format = Prettier**.
- Single repo now; **pnpm-workspaces monorepo later** when the Chrome extension lands
  (it shares types via a future `packages/shared` but never touches the DB directly — API only).

## Repository layout

`src/routes/` (file-based routing: `__root.tsx`, public LP routes, `_authed/*` protected
dashboard, `api/auth.$.tsx`) · `src/server/` (`createServerFn`) · `src/components/{ui,tracker,
layout}` · `src/db/{schema.ts,client.ts}` · `src/lib/{supabase,resend,stripe}.ts` ·
`drizzle/` (migrations). The Drizzle schema in `src/db/schema.ts` is the source of truth for
the data model.

## User identity (critical)

Supabase Auth owns accounts in `auth.users` (id = UUID). Our app `users` table **does not
re-implement auth** — it references the Supabase UUID as its key.

- `users.id` = **UUID = `auth.users.id`** (never a generated id).
- A `users` row is created on first login (upsert in the auth `createServerFn`, or a Postgres
  `on auth.users insert` trigger).
- All app FKs (`opportunities.user_id`, `reminders`…) point to `users.id`.

## Guest mode & persistence (single source of truth)

- **Logged out = ephemeral trial.** Entries live in `localStorage` only. Push account
  creation early (visible CTA).
- **One-shot migration on login.** On first dashboard load, if (`localStorage` not empty AND
  user logged in) → insert entries via a `createServerFn`, then **clear `localStorage`**.
  Trigger on dashboard load (not in the auth callback) to survive the Google OAuth redirect.
- **No dedup** at MVP (assumed simplicity).
- **Logged in = DB is the only source of truth.** No more `localStorage` reads/writes.

## Code conventions

- **Files: kebab-case** (`user-card.tsx`), one component per file. Lib-imposed exceptions:
  `__root.tsx`, `routeTree.gen.ts`.
- **Components: PascalCase** inside the file (`export function UserCard()`).
- Utility functions: camelCase.
- Code comments in English (see the language rule above).
- Env vars in `.env` (never hardcoded, never committed).
- **Zod validation** (`.validator`) on every `createServerFn` before touching the DB.
- Strict typing, no `any`, `noUncheckedIndexedAccess` on. Use precise types.
- Import alias `@/*` → `src/*` (always use existing aliases).
- Avoid unnecessary dependencies — prefer existing code / stdlib first.
- Keep changes focused — don't refactor unrelated files.
- Cover **mobile** and **dark-theme** states when relevant.

### Lint & format (ESLint + Prettier)

- **Prettier** (`.prettierrc.json`): single quotes, no semicolons, `trailingComma: all`,
  2-space indent, width 100, JSX double quotes, arrow parens always.
- **ESLint** (`eslint.config.js`, flat config): `@eslint/js` + `typescript-eslint`
  (recommended) + `react-hooks` + `react-refresh`, with `eslint-config-prettier` last to
  disable style rules that would fight Prettier.
- `react-refresh/only-export-components` is disabled for `src/routes/**` (route files export
  both `Route` and the component by design).
- `src/routeTree.gen.ts` and build dirs are ignored by both.

## Tooling

- **pnpm 10** (`packageManager`), **Node 24** (`.nvmrc`).
- `husky` + `lint-staged` pre-commit → `eslint --fix` + `prettier --write` on staged files.
- CI (`.github/workflows/quality-checks.yml`) on PRs to `main`:
  `install --frozen-lockfile` → `routes:gen` → `lint:ci` → `format:check` → `typecheck` → `test`.
- `routeTree.gen.ts` is gitignored; regenerate with `pnpm routes:gen` (also `pretypecheck`).
- Env vars: see `.env.example`.

## Commands

```bash
pnpm dev            # Vite dev server (SSR)
pnpm build          # Production build (Nitro)
pnpm start          # Run the built server
pnpm routes:gen     # Regenerate routeTree.gen.ts (also runs on pretypecheck)
pnpm typecheck      # tsc --noEmit (routes generated first)
pnpm lint           # ESLint
pnpm lint:fix       # ESLint --fix
pnpm lint:ci        # ESLint --max-warnings 0 (CI gate)
pnpm format         # Prettier --write
pnpm format:check   # Prettier --check (CI gate)
pnpm test           # Vitest run
```

## Critical rules

- Never change `src/db/schema.ts` without generating a migration
  (`drizzle-kit generate` → `drizzle-kit migrate`).
- Never expose `SUPABASE_SERVICE_ROLE_KEY` client-side.
- Auth SSR: resolve the session in a `createServerFn` + `beforeLoad` (root for the current
  user, `_authed.tsx` to protect the dashboard). Use `supabase.auth.getUser()` (verified) for
  identity checks, not just `getSession()`.
- **RLS**: enable Row Level Security on app tables; user access via the authenticated Supabase
  client. Service-role access (Drizzle admin, crons) bypasses RLS — server only, never client.
- Email reminders run via a **Vercel cron** (server route) — never client-side.

## Contributions & Git

- **Conventional commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `ci:`, `test:`…).
  Short imperative subject; optional body for the _why_.
- **Never add a `Co-Authored-By: Claude` trailer or any "Generated with Claude Code" mention**
  in commits or PR bodies. No agent co-signature.
- Commit/push only when explicitly asked.
- One Linear ticket = one `dev-XX-…` branch (name provided by Linear) = one PR to `main`.
- PR title in conventional-commit form referencing the ticket. Explain any new reusable
  pattern or new dependency (why, rejected alternative). Note mobile/dark states when UI.
