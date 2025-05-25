CREATE TABLE "warehouse"."notifications" (
	"title" text NOT NULL,
	"content" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations_notifications" (
	"organization_id" varchar NOT NULL,
	"notification_id" varchar NOT NULL,
	"read_at" timestamp,
	CONSTRAINT "organizations_notifications_organization_id_notification_id_pk" PRIMARY KEY("organization_id","notification_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_notifications" ADD CONSTRAINT "organizations_notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_notifications" ADD CONSTRAINT "organizations_notifications_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "warehouse"."notifications"("id") ON DELETE cascade ON UPDATE no action;