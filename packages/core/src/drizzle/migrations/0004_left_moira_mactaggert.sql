ALTER TABLE "warehouse"."organization_discounts" RENAME TO "org_discounts";--> statement-breakpoint
ALTER TABLE "warehouse"."organization_addresses" RENAME TO "org_addresses";--> statement-breakpoint
ALTER TABLE "warehouse"."organization_users" RENAME TO "org_users";--> statement-breakpoint
ALTER TABLE "warehouse"."org_discounts" DROP CONSTRAINT "organization_discounts_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."org_discounts" DROP CONSTRAINT "organization_discounts_discount_id_discounts_v1_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."org_addresses" DROP CONSTRAINT "organization_addresses_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."org_addresses" DROP CONSTRAINT "organization_addresses_address_id_addresses_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."org_users" DROP CONSTRAINT "organization_users_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."org_users" DROP CONSTRAINT "organization_users_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "warehouse"."org_discounts" DROP CONSTRAINT "organization_discounts_organization_id_discount_id_pk";--> statement-breakpoint
ALTER TABLE "warehouse"."org_users" DROP CONSTRAINT "organization_users_user_id_organization_id_pk";--> statement-breakpoint
ALTER TABLE "warehouse"."org_discounts" ADD CONSTRAINT "org_discounts_organization_id_discount_id_pk" PRIMARY KEY("organization_id","discount_id");--> statement-breakpoint
ALTER TABLE "warehouse"."org_users" ADD CONSTRAINT "org_users_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id");--> statement-breakpoint
ALTER TABLE "warehouse"."org_discounts" ADD CONSTRAINT "org_discounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_discounts" ADD CONSTRAINT "org_discounts_discount_id_discounts_v1_id_fk" FOREIGN KEY ("discount_id") REFERENCES "warehouse"."discounts_v1"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_addresses" ADD CONSTRAINT "org_addresses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_addresses" ADD CONSTRAINT "org_addresses_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "warehouse"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_users" ADD CONSTRAINT "org_users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "warehouse"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse"."org_users" ADD CONSTRAINT "org_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "warehouse"."users"("id") ON DELETE cascade ON UPDATE no action;