# ADR 0003 — Auth error mapping and account enumeration

- **Status**: Accepted
- **Date**: 2026-08-05
- **Context ticket**: DEV-18 (Supabase SSR auth)

## Context

`supabase.auth.signUp()` and `signInWithPassword()` return a GoTrue `AuthError` carrying a
`message` and a `code`. The first implementation forwarded `error.message` straight to the
form, which produced two defects: the text was **English in both locales** (GoTrue does not
localise its API errors), and raw provider messages can describe internals we don't want to
publish.

Auth errors also differ from the rest of the app's errors in one respect: what we choose to
say can **confirm whether an account exists**. That makes the mapping a security decision,
not just a copy decision.

## Options considered

- **Translate `error.message`** — match on the English strings GoTrue returns. Rejected: the
  message is prose, free to change in any release; `code` is the field documented as stable.
- **Put the GoTrue codes in `ERROR_MESSAGES`** (`src/lib/error.ts`) — skip the translation
  layer and key the registry on `user_already_exists`, `invalid_credentials`, … Rejected:
  `lib/error.ts` is the app's own error vocabulary, shared with the opportunities module.
  Admitting a provider's codes there means `appError('user_already_exists')` type-checks
  everywhere, duplicates entries when two GoTrue codes mean one thing to a user
  (`user_already_exists` / `email_exists`), and sets the precedent that every future provider
  adds its dictionary to the same file.
- **Map all 84 GoTrue codes** — exhaustive coverage. Rejected: most describe features we
  don't use (MFA, SAML, SSO, phone, hooks), and codes that leave the user the same next step
  don't deserve different messages.

## Decision

A provider's vocabulary **stops at the boundary**. `auth-server.ts` is the only file that
talks to GoTrue, so it is the only file that translates: `toAuthErrorCode()`
(`src/modules/auth/auth-utils.ts`) maps a GoTrue code to an app `ErrorCode`, and everything
downstream — the RPC payload, the forms, `lib/error.ts` — speaks app codes only.

Codes are grouped by **the action they leave the user**, not by their GoTrue identity:

| Action                | GoTrue codes                                                               | App code                   |
| --------------------- | -------------------------------------------------------------------------- | -------------------------- |
| Fix your input        | `invalid_credentials`                                                      | `AUTH_INVALID_CREDENTIALS` |
|                       | `user_already_exists`, `email_exists`                                      | `AUTH_EMAIL_TAKEN`         |
|                       | `email_address_invalid`, `validation_failed`, `weak_password`              | `VALIDATION`               |
| Wait and retry        | `over_email_send_rate_limit`, `over_request_rate_limit`, `request_timeout` | `RATE_LIMITED`             |
| Nothing you can do    | `user_banned`                                                              | `AUTH_ACCOUNT_LOCKED`      |
|                       | `signup_disabled`, `email_provider_disabled`                               | `AUTH_SIGNUP_DISABLED`     |
| Everything else (~75) | `unexpected_failure`, `hook_*`, `bad_json`, MFA/SAML/SSO…                  | `SERVER` (fallback)        |

The fallback is what makes the coverage complete without being exhaustive: an unmapped or
newly introduced code degrades to a correct generic message instead of failing.

### Enumeration trade-off

**Sign-up reveals existence** (`AUTH_EMAIL_TAKEN`) — a registration form cannot both refuse a
duplicate email and hide that it is a duplicate. This is the common trade-off (GitHub, Google).

**Sign-in does not.** `signInWithPassword` surfaces only codes that say nothing about the
account (`RATE_LIMITED`, `AUTH_SIGNUP_DISABLED`); everything else — including `user_banned`,
which would confirm the account exists — collapses into `AUTH_INVALID_CREDENTIALS`. A wrong
password is therefore indistinguishable from an unknown account.

## Consequences

- Adding a provider error means editing `AUTH_ERROR_CODES`, never `lib/error.ts`.
- Two `ErrorCode`s are auth-specific (`AUTH_ACCOUNT_LOCKED`, `AUTH_SIGNUP_DISABLED`); the
  others reuse the existing generic entries.
- **`email_not_confirmed` is deliberately unmapped** (falls back to `SERVER`). It is
  unreachable while email confirmation is disabled on the Supabase project — which is also
  why sign-up can return an error on a duplicate email at all; with confirmation on, GoTrue
  returns a fake user instead, precisely to prevent enumeration. Turning confirmation on
  means revisiting three things together: this code, the `AUTH_EMAIL_TAKEN` path (which stops
  firing), and the sign-up success screen (which needs a "check your inbox" state).
- Copy lives in `messages/{fr,en}.json` under `error_auth*`; see
  [`i18n.md`](../reference/i18n.md).
