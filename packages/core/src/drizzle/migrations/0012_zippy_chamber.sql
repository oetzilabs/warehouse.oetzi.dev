ALTER TABLE "warehouse"."addresses" ADD COLUMN "lat" numeric NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."addresses" ADD COLUMN "lon" numeric NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."addresses" DROP COLUMN "lat_lon";