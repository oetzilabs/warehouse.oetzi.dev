CREATE TYPE "warehouse"."order_status" AS ENUM('pending', 'processing', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "warehouse"."orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"warehouse"."order_status";--> statement-breakpoint
ALTER TABLE "warehouse"."orders" ALTER COLUMN "status" SET DATA TYPE "warehouse"."order_status" USING "status"::"warehouse"."order_status";--> statement-breakpoint
ALTER TABLE "warehouse"."orders" DROP COLUMN "metadata";