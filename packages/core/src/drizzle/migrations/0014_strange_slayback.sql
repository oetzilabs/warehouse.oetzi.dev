CREATE TABLE "warehouse"."customer_preferred_pickuptimes" (
	"customer_id" varchar NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"notes" varchar,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."customer_preferred_deliverytimes" (
	"customer_id" varchar NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"notes" varchar,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."customer_preferred_pickuptimes" ADD CONSTRAINT "customer_preferred_pickuptimes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_preferred_deliverytimes" ADD CONSTRAINT "customer_preferred_deliverytimes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE cascade ON UPDATE no action;