CREATE TYPE "public"."payment_method_type" AS ENUM('cash', 'card', 'bank_account');--> statement-breakpoint
CREATE TABLE "warehouse"."payment_methods" (
	"type" "payment_method_type" NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."user_payment_methods" (
	"user_id" varchar NOT NULL,
	"payment_method_id" varchar NOT NULL,
	CONSTRAINT "user_payment_methods_user_id_payment_method_id_pk" PRIMARY KEY("user_id","payment_method_id")
);
--> statement-breakpoint
ALTER TABLE "warehouse"."user_payment_methods" ADD CONSTRAINT "user_payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."user_payment_methods" ADD CONSTRAINT "user_payment_methods_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "warehouse"."payment_methods"("id") ON DELETE cascade ON UPDATE no action;