CREATE TYPE "warehouse"."reoccurrence_type" AS ENUM('none', 'daily', 'weekly', 'biweekly', 'monthly', 'semimonthly', 'quarterly', 'yearly', 'custom');--> statement-breakpoint
CREATE TYPE "warehouse"."schedule_status" AS ENUM('scheduled', 'preparing', 'ready', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "warehouse"."schedule_type" AS ENUM('delivery', 'pickup');--> statement-breakpoint
CREATE TABLE "warehouse"."schedules" (
	"schedule_start" timestamp NOT NULL,
	"schedule_end" timestamp NOT NULL,
	"reoccurrence" "warehouse"."reoccurrence_type" DEFAULT 'none' NOT NULL,
	"interval" integer DEFAULT 0 NOT NULL,
	"until" timestamp,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."customer_schedules" (
	"customer_id" varchar NOT NULL,
	"schedule_id" varchar NOT NULL,
	"type" "warehouse"."schedule_type" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "warehouse"."customer_schedules" ADD CONSTRAINT "customer_schedules_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "warehouse"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."customer_schedules" ADD CONSTRAINT "customer_schedules_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "warehouse"."schedules"("id") ON DELETE no action ON UPDATE no action;