-- Trigram indexes for the toolbar search. Drizzle cannot express GIN/gin_trgm_ops, so this
-- migration is hand-written. See docs/reference/server-side-table.md
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint

-- `ILIKE '%q%'` has a leading wildcard, so no B-tree index applies; trigrams do.
CREATE INDEX IF NOT EXISTS "opportunities_recruiter_trgm_idx" ON "opportunities" USING gin ("recruiter" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunities_esn_trgm_idx" ON "opportunities" USING gin ("esn" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunities_end_client_trgm_idx" ON "opportunities" USING gin ("end_client" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunities_location_trgm_idx" ON "opportunities" USING gin ("location" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunities_need_trgm_idx" ON "opportunities" USING gin ("need" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stages_name_trgm_idx" ON "stages" USING gin ("name" gin_trgm_ops);
