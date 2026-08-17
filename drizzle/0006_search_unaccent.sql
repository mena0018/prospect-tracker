-- Accent-insensitive search. Hand-written like 0005: Drizzle cannot express an expression
-- index, and the IMMUTABLE wrapper below is a deliberate lie to the planner.
-- Rationale and the rebuild caveat: docs/reference/server-side-table.md
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint

-- `unaccent()` is STABLE, not IMMUTABLE, because it reads a dictionary that a superuser can
-- change at runtime — and an expression index may only call IMMUTABLE functions. Pinning the
-- dictionary name makes the call deterministic for every input we will ever pass, so we
-- re-declare it. If the `unaccent` dictionary is ever modified, every index below is silently
-- wrong and must be REINDEXed.
CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$ SELECT public.unaccent('public.unaccent', $1) $$;--> statement-breakpoint

-- One trigram index per searched column, on the unaccented expression. The query must call
-- `immutable_unaccent` on the column too, or the planner cannot match these.
CREATE INDEX IF NOT EXISTS "opportunities_recruiter_unaccent_trgm_idx" ON "opportunities" USING gin (immutable_unaccent("recruiter") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunities_esn_unaccent_trgm_idx" ON "opportunities" USING gin (immutable_unaccent("esn") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunities_end_client_unaccent_trgm_idx" ON "opportunities" USING gin (immutable_unaccent("end_client") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunities_location_unaccent_trgm_idx" ON "opportunities" USING gin (immutable_unaccent("location") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunities_need_unaccent_trgm_idx" ON "opportunities" USING gin (immutable_unaccent("need") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stages_name_unaccent_trgm_idx" ON "stages" USING gin (immutable_unaccent("name") gin_trgm_ops);--> statement-breakpoint

-- The plain-text trigram indexes from 0005 are now dead: every search path goes through
-- `immutable_unaccent`, so nothing can use them, and a GIN index still costs write amplification.
DROP INDEX IF EXISTS "opportunities_recruiter_trgm_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "opportunities_esn_trgm_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "opportunities_end_client_trgm_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "opportunities_location_trgm_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "opportunities_need_trgm_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "stages_name_trgm_idx";
