CREATE TABLE "warehouse"."messages" (
	"title" text NOT NULL,
	"content" text NOT NULL,
	"owner_id" text NOT NULL,
	"sender" text NOT NULL,
	"recipient" text NOT NULL,
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."messages" ADD CONSTRAINT "messages_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "warehouse"."users"("id") ON DELETE no action ON UPDATE no action;