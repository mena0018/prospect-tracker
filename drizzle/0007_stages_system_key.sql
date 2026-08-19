ALTER TABLE "stages" ADD COLUMN "system_key" text;--> statement-breakpoint
-- Backfill by position: reliable only while nobody can reorder — see docs/reference/kpis.md
UPDATE "stages" SET "system_key" = CASE "position"
  WHEN 0 THEN 'saved'
  WHEN 1 THEN 'contacted'
  WHEN 2 THEN 'cv_sent'
  WHEN 3 THEN 'interview'
  WHEN 4 THEN 'offer'
  WHEN 5 THEN 'rejected'
  WHEN 6 THEN 'ghosted'
END
WHERE "position" BETWEEN 0 AND 6;--> statement-breakpoint
CREATE UNIQUE INDEX "stages_user_system_key_idx" ON "stages" USING btree ("user_id","system_key") WHERE "stages"."system_key" is not null;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_system_key_token" CHECK ("stages"."system_key" is null or "stages"."system_key" in ('saved','contacted','cv_sent','interview','offer','rejected','ghosted'));--> statement-breakpoint

-- System stages are not deletable: enforced in the policy so a direct authenticated
-- client cannot bypass the server fn — see docs/reference/data-model.md
DROP POLICY IF EXISTS "stages_delete_own" ON "stages";--> statement-breakpoint
CREATE POLICY "stages_delete_own" ON "stages"
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = "user_id" AND "system_key" IS NULL);--> statement-breakpoint

-- system_key is written once at seed and must survive a rename
CREATE OR REPLACE FUNCTION "stages_freeze_system_key"() RETURNS trigger AS $$
BEGIN
  IF OLD."system_key" IS DISTINCT FROM NEW."system_key" THEN
    RAISE EXCEPTION 'system_key is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER "stages_freeze_system_key_trg"
  BEFORE UPDATE ON "stages"
  FOR EACH ROW EXECUTE FUNCTION "stages_freeze_system_key"();
