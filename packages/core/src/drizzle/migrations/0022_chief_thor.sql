ALTER TABLE "warehouse"."products" ALTER COLUMN "currency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "warehouse"."products" ALTER COLUMN "currency" SET NOT NULL;