CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled', 'suspended');--> statement-breakpoint
ALTER TABLE "warehouse"."users" ADD COLUMN "current_organization_id" varchar;--> statement-breakpoint
ALTER TABLE "warehouse"."users" ADD COLUMN "status" "user_status" DEFAULT 'active';