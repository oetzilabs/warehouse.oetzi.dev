CREATE TABLE "warehouse"."device_actions" (
	"name" text NOT NULL,
	"description" text,
	"file" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."device_device_actions" (
	"device_id" varchar NOT NULL,
	"action_id" varchar NOT NULL,
	CONSTRAINT "device_device_actions_device_id_action_id_pk" PRIMARY KEY("device_id","action_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."devices" ADD COLUMN "connection_string" text;--> statement-breakpoint
ALTER TABLE "warehouse"."device_device_actions" ADD CONSTRAINT "device_device_actions_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "warehouse"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."device_device_actions" ADD CONSTRAINT "device_device_actions_action_id_device_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "warehouse"."device_actions"("id") ON DELETE cascade ON UPDATE no action;