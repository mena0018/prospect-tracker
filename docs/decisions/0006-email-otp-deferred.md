# ADR 0006 — Email OTP deferred until a custom domain exists

- **Status**: Deferred — revisit when a custom domain is registered
- **Date**: 2026-08-18
- **Context ticket**: none (raised while fixing the Google OAuth redirect config)

## Context

The current sign-in offers email + password and Google. Replacing the password with a
six-digit email OTP was considered, keeping Google alongside it.

The product argument is real. Most of the audience (freelancers, work-study students, job
seekers) arrives through Google; a user who signed up with Google and returns weeks later
cannot remember whether they ever had a password. Converging both paths on the email address
removes that branch, and removes the password-reset flow — which is unbuilt work, not just
existing code.

What blocks it is delivery, not code.

## Why it is blocked

Supabase Auth's built-in SMTP **refuses to deliver to addresses outside the project's team**.
It exists for local exploration and template testing, not production. Sending an OTP to real
users therefore requires custom SMTP, and custom SMTP requires a domain verified by DNS
(SPF, DKIM, DMARC).

The app runs on `prospect-tracker-new.vercel.app`. That domain belongs to Vercel — its DNS
records are not ours to set, so it can never be verified.

Resend's sandbox sender (`onboarding@resend.dev`) does not work around this: it only delivers
to the address the Resend account was registered with. Same restriction as Supabase's
built-in SMTP, so it buys nothing.

**A custom domain is a hard prerequisite.** Without it, the OTP flow builds and passes its
tests while no real user can ever log in.

## Options considered

- **Ship OTP now, wire the domain later** — implement against the built-in SMTP and test with
  the project owner's address. Rejected: it replaces a working auth flow with one that cannot
  authenticate anybody, and the only account able to test it is the one account that does not
  need testing.
- **Magic link instead of a six-digit code** — the more common passwordless shape. Rejected on
  a specific ground, see below.
- **Keep the password permanently, add OTP as a second option** — no migration, no domain
  dependency. Rejected as an end state: two auth flows to maintain for a product with no users
  yet. Retained implicitly as the status quo while deferred.

### Why a code, not a clickable link

This is the decision most likely to be re-litigated, so it is recorded with its reason.

Guest mode stores the trial in `localStorage` and migrates it to the database once, on the
first dashboard load after login (see [`guest-mode.md`](../reference/guest-mode.md)).

A clickable magic link is opened in the user's mail client — another tab, often another
device. The session then opens in a context that **does not hold the `localStorage`**, and the
trial data is stranded on the original tab. That is precisely the conversion moment the
product cannot afford to lose.

A six-digit code is typed into the **originating tab**, so `localStorage` is intact and the
existing migration works unchanged. It also sidesteps the PKCE constraint: `code_verifier` is
stored in the initiating browser, so a link opened elsewhere cannot complete
`exchangeCodeForSession`.

## Decision

**Keep email + password + Google.** Revisit when a custom domain is registered.

The domain is not a cost attributable to auth: it is needed anyway for the follow-up reminder
emails (`src/lib/resend.ts`), which are the core of the product. Registering it for reminders
brings OTP along nearly for free.

### Settled for the revisit

So the discussion resumes at implementation, not at first principles:

- **Full password removal**, no fallback. Sign-up and sign-in merge into one two-step screen
  (email → code) via `shouldCreateUser: true`.
- **`fullName` and `jobTitle` move to a post-login onboarding screen.** OTP sign-up collects
  only an email, so both fields disappear from registration. Skipped for Google accounts,
  which already carry `full_name` in their claims. The `provisioned` flag in `user_metadata`
  is the existing signal for "first login" — no new state needed.
- **Supabase's "Magic Link" template with `{{ .Token }}`** renders the code. The template, not
  the method, decides between link and code — `signInWithOtp` serves both. This is the least
  obvious part of the setup.
- **Resend Free covers it**: 3 000 emails/month, 100/day, one custom domain, €0. Google logins
  cost no email at all. The binding limit is Supabase's, not Resend's: **30 new users per hour**
  by default with custom SMTP, raise it in Auth → Rate Limits before any public launch.
- **Disable link tracking in Resend** — it rewrites links and deforms auth URLs.
- **Disable email confirmation** in Auth → Providers → Email: the OTP already proves the
  address is controlled.

### Code affected when resumed

| File                                 | Change                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `auth-schema.ts`                     | drop `credentialsSchema`, `signUpSchema`, `signUpFormSchema`; add `otpRequestSchema`, `otpVerifySchema`                   |
| `auth-server.ts`                     | drop `signInWithPassword`, `signUpWithPassword`; add `requestOtp`, `verifyOtp`. `fetchUser` and `provisionUser` unchanged |
| `signin-form.tsx`, `signup-form.tsx` | merge into one two-step form; the `mode=signin\|signup` search param loses its purpose                                    |
| `utils/error-code.ts`                | drop `invalid_credentials` / `weak_password`; add `otp_expired`, `otp_disabled`                                           |
| `lib/error.ts`                       | `AUTH_INVALID_CREDENTIALS` → `AUTH_OTP_INVALID`, plus its i18n copy                                                       |

The OTP input comes from the shadcn registry (`input-otp`), per the no-hand-rolled-primitives
rule in `CLAUDE.md`.

## Consequences

- The password flow stays live, so **[ADR 0003](0003-auth-error-mapping.md) stays fully in
  force**. Resuming this work rewrites part of its mapping table: the "fix your input" row
  loses `invalid_credentials` and `weak_password`, and its enumeration trade-off needs
  rereading — an OTP flow that always says "code sent" is _less_ enumerable than the current
  sign-up, which reveals existence through `AUTH_EMAIL_TAKEN`.
- Guest-mode migration is untouched while deferred, and stays untouched by the OTP design.
  Any future move to a clickable magic link would break it — that is the reason recorded above.
- No new dependency today. Resend is already in the stack for reminders; OTP would reuse the
  same account and verified domain, with no additional package.
