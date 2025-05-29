CREATE TABLE "warehouse"."tax_rates" (
	"rate" numeric NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."tax_groups" (
	"name" text NOT NULL,
	"description" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."tax_group_coutryrates" (
	"country_code" varchar NOT NULL,
	"tax_group_id" varchar NOT NULL,
	"tax_rate_id" varchar NOT NULL,
	"effective_date" timestamp DEFAULT now() NOT NULL,
	"expiration_date" timestamp,
	CONSTRAINT "tax_group_coutryrates_tax_group_id_tax_rate_id_pk" PRIMARY KEY("tax_group_id","tax_rate_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."products" ADD COLUMN "default_tax_group_id" text;--> statement-breakpoint
ALTER TABLE "warehouse"."tax_group_coutryrates" ADD CONSTRAINT "tax_group_coutryrates_tax_group_id_tax_groups_id_fk" FOREIGN KEY ("tax_group_id") REFERENCES "warehouse"."tax_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."tax_group_coutryrates" ADD CONSTRAINT "tax_group_coutryrates_tax_rate_id_tax_rates_id_fk" FOREIGN KEY ("tax_rate_id") REFERENCES "warehouse"."tax_rates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."products" ADD CONSTRAINT "products_default_tax_group_id_tax_groups_id_fk" FOREIGN KEY ("default_tax_group_id") REFERENCES "warehouse"."tax_groups"("id") ON DELETE no action ON UPDATE no action;