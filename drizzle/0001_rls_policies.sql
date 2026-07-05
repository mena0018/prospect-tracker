-- Row Level Security for all app tables.
--
-- Every app table carries a direct owner column, so the policy predicate is
-- trivial: the row belongs to the current Supabase Auth user.
--   - users:              auth.uid() = id       (users.id IS the auth UUID)
--   - all other tables:   auth.uid() = user_id
--
-- Access is granted to the `authenticated` role only (the anon key gets nothing).
-- The service-role Drizzle client (src/db/client.ts) bypasses RLS entirely and
-- is server-only — never imported from client code.
--
-- One policy per CRUD operation. INSERT/UPDATE carry a WITH CHECK so a user can
-- never create or move a row into another user's ownership.

-- users -----------------------------------------------------------------------
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "users_select_own" ON "users"
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = "id");--> statement-breakpoint

CREATE POLICY "users_insert_own" ON "users"
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = "id");--> statement-breakpoint

CREATE POLICY "users_update_own" ON "users"
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = "id")
  WITH CHECK ((SELECT auth.uid()) = "id");--> statement-breakpoint

CREATE POLICY "users_delete_own" ON "users"
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = "id");--> statement-breakpoint

-- stages ----------------------------------------------------------------------
ALTER TABLE "stages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "stages_select_own" ON "stages"
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "stages_insert_own" ON "stages"
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "stages_update_own" ON "stages"
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "stages_delete_own" ON "stages"
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

-- job_types -------------------------------------------------------------------
ALTER TABLE "job_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "job_types_select_own" ON "job_types"
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "job_types_insert_own" ON "job_types"
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "job_types_update_own" ON "job_types"
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "job_types_delete_own" ON "job_types"
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

-- experience_levels -----------------------------------------------------------
ALTER TABLE "experience_levels" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "experience_levels_select_own" ON "experience_levels"
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "experience_levels_insert_own" ON "experience_levels"
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "experience_levels_update_own" ON "experience_levels"
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "experience_levels_delete_own" ON "experience_levels"
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

-- opportunities ---------------------------------------------------------------
ALTER TABLE "opportunities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "opportunities_select_own" ON "opportunities"
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "opportunities_insert_own" ON "opportunities"
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "opportunities_update_own" ON "opportunities"
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");--> statement-breakpoint

CREATE POLICY "opportunities_delete_own" ON "opportunities"
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = "user_id");
