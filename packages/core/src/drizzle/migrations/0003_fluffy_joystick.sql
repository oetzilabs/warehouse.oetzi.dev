CREATE TABLE "warehouse"."addresses" (
	"street" text NOT NULL,
	"house_number" text NOT NULL,
	"additional" text,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"state" text,
	"country" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."warehouse_addresses" (
	"warehouse_id" varchar NOT NULL,
	"address_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organization_addresses" (
	"organization_id" varchar NOT NULL,
	"address_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" ALTER COLUMN "address" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" ALTER COLUMN "address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations" ALTER COLUMN "address" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_addresses" ADD CONSTRAINT "warehouse_addresses_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouse_addresses" ADD CONSTRAINT "warehouse_addresses_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_addresses" ADD CONSTRAINT "organization_addresses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_addresses" ADD CONSTRAINT "organization_addresses_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" ADD CONSTRAINT "warehouses_address_addresses_id_fk" FOREIGN KEY ("address") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations" ADD CONSTRAINT "organizations_address_addresses_id_fk" FOREIGN KEY ("address") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;