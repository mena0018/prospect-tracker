# ADR 0001 — User-configurable pipeline (stages, job types, experience levels)

- **Status**: Accepted
- **Date**: 2026-07-04
- **Context ticket**: DEV-17 (Database + Drizzle schema & migrations)
- **Supersedes**: the enum-based data model implied by the original DEV-17 and the PRD

## Context

The original plan (PRD + DEV-17 ticket) modelled the pipeline stage and the job
type as fixed Postgres enums (`stage`, and a hardcoded post/role list). A later
design iteration in Claude Design introduced a **"Personnaliser"** panel where the
user can:

- rename, recolor (color picker), reorder and archive **their own** pipeline stages,
  and add new ones;
- edit the list of **job types** used in the opportunity form;
- set a **reference day-rate** (TJM) used for green/red coloring;
- (implied by the same reasoning) edit **experience levels**.

Fixed enums cannot express any of this: an enum is global and immutable per
deploy, and renaming/recoloring/archiving a value per user is impossible.

## Decision

1. **Stages, job types and experience levels become per-user tables**
   (`stages`, `job_types`, `experience_levels`), each with a `user_id` FK and a
   `position`. They are **seeded with defaults on signup** so the pipeline is never
   empty, then fully editable.

2. **Opportunities reference these tables by FK** (`stage_id`, `job_type_id`,
   `experience_id`) rather than storing an enum/text. Renaming or recoloring a
   stage propagates automatically to every opportunity on it.

3. **Delete policies encode the product rules**:
   - `opportunities.stage_id` → `ON DELETE RESTRICT`: a stage holding
     opportunities cannot be deleted; the user moves them first (the UI also offers
     "archive" instead of delete).
   - `opportunities.job_type_id` / `experience_id` → `ON DELETE SET NULL`:
     deleting a config value must not destroy the opportunity.
   - all `user_id` FKs → `ON DELETE CASCADE`.

4. **Stage color is a fixed-palette token** (`slate`, `blue`, … 10 values), stored
   as text, enforced by both a Zod `z.enum` and a Postgres `CHECK` constraint. The
   MVP uses ~10 swatches rather than a free color picker, so a stable token lets us
   restyle the palette and handle light/dark without rewriting stored rows. The
   token → light/dark hex mapping is a front-end concern, added with the UI
   (DEV-19/21/26). (An earlier draft stored a raw `#RRGGBB` hex, which only makes
   sense with a free picker — dropped once the palette was fixed.)

5. **The follow-up delay is per stage** (`stages.reminder_delay_days`, default 7),
   matching the PRD's "delay configurable per stage".

6. **The "à relancer" state is computed, not stored** — derived from
   `last_contact_at + stage.reminder_delay_days` (or a user-forced
   `next_reminder_at`). Nothing to toggle or keep in sync.

7. **`plan` and identity stay as-is**: `plan` remains an enum (`free`|`pro`, a
   genuine fixed business value). `users.id` is the Supabase Auth UUID; password
   and email authority remain in `auth.users`.

8. **The `reminders` table (email send history) is deferred** to the email
   reminders ticket. This model computes the state but does not send or log emails.

## Alternatives considered

- **Keep enums, ship "Personnaliser" as a v2.** Rejected: the panel is already in
  the finalized design and is core to the "your pipeline" value prop; shipping the
  MVP with a non-functional customization panel is worse than the extra tables.
- **Store stages/job types as JSONB on `users`.** Rejected: an opportunity's stage
  would be free text with no referential integrity, making rename/archive fragile
  and RLS/queries messier. FK tables are cleaner and barely more code.
- **Keep `experience` as an enum.** Initially chosen, then rejected for consistency
  with the "anything the user edits in a select = a table" principle. Junior /
  Confirmé / Senior is now a seeded, editable table like the others.

## Consequences

- More tables and a signup-time seed step (7 stages + 6 job types + 3 experience
  levels per user), plus a "move opportunities before deleting a stage" flow.
- Reads that show stage name/color join `opportunities → stages` (or preload the
  small per-user config sets).
- The original DEV-17 ticket and the PRD data-model section are now outdated and
  must be updated to reflect this model.
- The full model reference lives in [`docs/reference/data-model.md`](../reference/data-model.md).
