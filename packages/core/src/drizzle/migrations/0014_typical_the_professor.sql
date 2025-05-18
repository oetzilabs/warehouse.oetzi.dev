CREATE TYPE "warehouse"."message_type" AS ENUM('draft', 'normal');--> statement-breakpoint
ALTER TABLE "warehouse"."messages" DROP CONSTRAINT "messages_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."messages" ADD COLUMN "type" "warehouse"."message_type" DEFAULT 'normal';--> statement-breakpoint
ALTER TABLE "warehouse"."messages" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "warehouse"."messages" DROP COLUMN "owner_id";