import { relations } from "drizzle-orm";
import { AnyPgColumn, boolean, text, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, InferOutput, minLength, object, omit, partial, pipe, string } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_addresses } from "../address";
import { TB_catalog_products } from "../catalogs/catalog_products";
import { TB_catalogs } from "../catalogs/catalogs";
import { commonTable } from "../entity";
import { TB_sessions } from "../sessions";
import { TB_users } from "../users/users";
import { TB_organization_customers } from "./organization_customers";
import { TB_organization_discounts } from "./organization_discounts";
import { TB_organization_suppliers } from "./organization_suppliers";
import { TB_organization_users } from "./organization_users";
import { TB_organizations_customerorders, TB_organizations_supplierorders } from "./organizations_orders";
import { TB_organizations_products } from "./organizations_products";
import { TB_organizations_sales } from "./organizations_sales";
import { TB_organizations_warehouses } from "./organizations_warehouses";

export const TB_organizations = commonTable(
  "organizations",
  {
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    image: text("image"),
    location: text("location"),
    description: text("description"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    uid: text("uid"),
    address_id: varchar("address").references(() => TB_addresses.id, { onDelete: "cascade" }),
    owner_id: varchar("owner")
      .references(() => TB_users.id, { onDelete: "cascade" })
      .notNull(),
  },
  "org",
);

export const organizations_relation = relations(TB_organizations, ({ many, one }) => ({
  owner: one(TB_users, {
    fields: [TB_organizations.owner_id],
    references: [TB_users.id],
  }),
  users: many(TB_organization_users),
  whs: many(TB_organizations_warehouses),
  discounts: many(TB_organization_discounts),
  supps: many(TB_organization_suppliers),
  customers: many(TB_organization_customers),
  products: many(TB_organizations_products),
  sessions: many(TB_sessions),
  catalogs: many(TB_catalogs),
  customerOrders: many(TB_organizations_customerorders),
  purchases: many(TB_organizations_supplierorders),
  sales: many(TB_organizations_sales),
}));

export type OrganizationSelect = typeof TB_organizations.$inferSelect;
export type OrganizationInsert = typeof TB_organizations.$inferInsert;

export const OrganizationCreateSchema = object({
  ...omit(createInsertSchema(TB_organizations), ["owner_id", "slug", "createdAt", "updatedAt"]).entries,
  name: pipe(string(), minLength(3)),
});
export type OrganizationCreate = InferInput<typeof OrganizationCreateSchema>;
export const OrganizationUpdateSchema = object({
  ...partial(OrganizationCreateSchema).entries,
  id: prefixed_cuid2,
  name: pipe(string(), minLength(3)),
});
export type OrganizationUpdate = InferInput<typeof OrganizationUpdateSchema>;
