import { relations } from "drizzle-orm";
import { AnyPgColumn, boolean, text, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, InferOutput, minLength, object, omit, partial, pipe, string } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { TB_addresses } from "./address";
import { commonTable } from "./entity";
import { TB_organization_users } from "./organization_users";
import { TB_organizations_warehouses } from "./organizations_warehouses";
import { TB_users } from "./users";

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
