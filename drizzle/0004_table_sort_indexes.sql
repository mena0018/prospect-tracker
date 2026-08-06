CREATE INDEX "opportunities_user_pinned_last_contact_idx" ON "opportunities" USING btree ("user_id","is_pinned" DESC NULLS LAST,"last_contact_at");--> statement-breakpoint
CREATE INDEX "opportunities_user_pinned_recruiter_idx" ON "opportunities" USING btree ("user_id","is_pinned" DESC NULLS LAST,"recruiter");--> statement-breakpoint
CREATE INDEX "opportunities_user_pinned_daily_rate_idx" ON "opportunities" USING btree ("user_id","is_pinned" DESC NULLS LAST,"daily_rate");--> statement-breakpoint
CREATE INDEX "opportunities_stage_id_idx" ON "opportunities" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "stages_user_position_idx" ON "stages" USING btree ("user_id","position");