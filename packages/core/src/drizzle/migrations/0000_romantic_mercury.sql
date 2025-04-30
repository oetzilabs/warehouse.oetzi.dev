CREATE SCHEMA "warehouse";
--> statement-breakpoint
CREATE TABLE "warehouse"."users" (
	"name" text NOT NULL,
	"email" text NOT NULL,
	"image" text,
	"phone" text,
	"verified_at" timestamp with time zone,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"user_id" varchar NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"access_token" text,
	"current_organization_id" varchar
);
--> statement-breakpoint
CREATE TABLE "warehouse"."warehouses" (
	"name" text NOT NULL,
	"description" text,
	"address" text NOT NULL,
	"type" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."warehouse_types" (
	"name" text NOT NULL,
	"description" text,
	"code" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."storages" (
	"warehouse_id" varchar NOT NULL,
	"type_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"capacity" integer NOT NULL,
	"current_occupancy" integer DEFAULT 0,
	"location" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."storage_types" (
	"name" text NOT NULL,
	"description" text,
	"code" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations" (
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image" text,
	"location" text,
	"description" text,
	"phone" text,
	"email" text,
	"website" text,
	"uid" text,
	"address" text,
	"owner" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organization_users" (
	"organization_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_users_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."organizations_warehouses" (
	"organization_id" varchar NOT NULL,
	"warehouse_id" varchar NOT NULL,
	CONSTRAINT "organizations_warehouses_organization_id_warehouse_id_pk" PRIMARY KEY("organization_id","warehouse_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse"."websockets" (
	"user_id" varchar,
	"connection_id" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "warehouse"."session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."warehouses" ADD CONSTRAINT "warehouses_type_warehouse_types_id_fk" FOREIGN KEY ("type") REFERENCES "warehouse"."warehouse_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storages" ADD CONSTRAINT "storages_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."storages" ADD CONSTRAINT "storages_type_id_storage_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "warehouse"."storage_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations" ADD CONSTRAINT "organizations_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_users" ADD CONSTRAINT "organization_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organization_users" ADD CONSTRAINT "organization_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_warehouses" ADD CONSTRAINT "organizations_warehouses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."organizations_warehouses" ADD CONSTRAINT "organizations_warehouses_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "warehouse"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."websockets" ADD CONSTRAINT "websockets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;