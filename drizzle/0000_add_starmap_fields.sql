-- Add slug and modelId to starmaps
ALTER TABLE "starmaps" ADD COLUMN "slug" text;
CREATE UNIQUE INDEX IF NOT EXISTS "starmaps_slug_unique" ON "starmaps"("slug");
ALTER TABLE "starmaps" ADD COLUMN "model_id" text;

-- Add stage and modelMessageId to starmap_responses
ALTER TABLE "starmap_responses" ADD COLUMN "stage" integer NOT NULL DEFAULT 1;
ALTER TABLE "starmap_responses" ADD COLUMN "model_message_id" text;
