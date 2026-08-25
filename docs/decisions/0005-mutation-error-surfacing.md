# ADR 0005 — Two error-surfacing patterns: inline field alert vs. retry toast

- **Status**: Accepted
- **Date**: 2026-08-13
- **Context**: DEV-22 (opportunity modal create/edit/archive/delete)

## Context

`signin-form.tsx` / `signup-form.tsx` surface a failed submit as an inline
`<FieldAlert>` fed by `form.state.errorMap.onSubmit` (see `utils/error-code.ts`'s
`toFormErrorCode`). `opportunity-sheet.tsx`'s create/update/delete flows
surface a failed submit as a `sonner` toast with a **Retry** action
(`use-error-toast.ts`, wired from `use-opportunity-mutations.ts`). The two
forms look inconsistent side by side, which reads as an accident rather than
a choice — this ADR records that it is a choice.

## Decision

Pick the pattern by what kind of failure the call site can actually produce,
not by "which form is it":

- **Inline `<FieldAlert>`** for failures that are a normal, expected outcome
  of the submitted data — wrong credentials, an email already taken, a weak
  password. The user didn't do anything wrong technically; they need to
  correct a field, not repeat the same request. There is nothing to retry
  automatically.
- **Toast with a Retry action** for failures that are infra/transport
  problems (network drop, 500, timeout) on data that was already valid —
  create/update/delete an opportunity. The user's input isn't at fault; the
  fix is to resend the exact same request, which the toast's `onRetry` does
  by re-calling `mutate` with the same payload (`use-opportunity-mutations.ts`).
  A toast also survives the sheet being closed, and a resend doesn't require
  the field values to still be mounted.

`opportunity-sheet.tsx`'s `form.handleSubmit().catch(() => {})` is not a
silenced error: `use-opportunity-editor.ts`'s `submit()` intentionally
rethrows so `handleSubmit()`'s promise rejects (keeping the sheet open,
values intact), and the mutation's `onError` has already shown the toast by
the time that rejection reaches the sheet. The `.catch(() => {})` only stops
that already-handled rejection from becoming an unhandled promise rejection
in the console — nothing about the error itself is dropped.

## Consequences

- Don't "fix" the inconsistency by making every form use the same pattern.
  If a future form's failures are field-correctable, use `<FieldAlert>`; if
  they're infra failures on already-valid data, use the retry toast.
- The retry toast depends on the mutation's input being idempotent-safe to
  resend as-is (`create`/`update`/`delete` all qualify — no side effect
  varies between the original attempt and the retry).
- The toast's action button must be styled to match the app's `Button`
  primitive (radius, focus ring, color) rather than sonner's raw default —
  see the `cn-toast` rules in `src/styles/globals.css`.
