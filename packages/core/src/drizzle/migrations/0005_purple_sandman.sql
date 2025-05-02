ALTER TABLE "warehouse"."session" ALTER COLUMN "access_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."session" ADD COLUMN "current_warehouse_id" varchar;--> statement-breakpoint
ALTER TABLE "warehouse"."users" DROP COLUMN "current_organization_id";--> statement-breakpoint
ALTER TABLE "warehouse"."users" DROP COLUMN "current_warehouse_id";