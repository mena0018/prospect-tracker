# Guest mode & persistence

How a logged-out trial works and how its entries reach the database on sign-up.
Single source of truth for this behaviour — not implemented yet, see the guest-mode
migration ticket.

## Rules

- **Logged out = ephemeral trial.** Entries live in `localStorage` only. Push account
  creation early (visible CTA).
- **One-shot migration on login.** On first dashboard load, if (`localStorage` not empty
  AND user logged in) → insert entries via a `createServerFn`, then **clear
  `localStorage`**.
- **Logged in = the DB is the only source of truth.** No more `localStorage` reads or
  writes.
- **No dedup** at MVP (assumed simplicity).

## Why the migration runs on dashboard load

Not in the auth callback: Google OAuth redirects away from the app and back, so a
migration started in the callback would be interrupted. The dashboard is the first
screen guaranteed to render with a session in place.

## See also

- [`data-model.md`](data-model.md) — the tables entries are migrated into
- [`auth.md`](auth.md) — sessions and the OAuth redirect flow
