ALTER TABLE "warehouse"."catalogs" ADD COLUMN "barcode" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."catalogs" ADD CONSTRAINT "catalogs_barcode_unique" UNIQUE("barcode");