import { relations } from "drizzle-orm";
import { boolean, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_organizations } from "../organizations/organizations";
import { TB_users } from "../users/users";
import { TB_catalog_products } from "./catalog_products";

// Main catalog table
export const TB_catalogs = commonTable(
  "catalogs",
  {
    name: text("name").notNull(),
    description: text("description"),
    organizationId: varchar("organization_id")
      .notNull()
      .references(() => TB_organizations.id),
    startDate: timestamp("start_date", { withTimezone: true, mode: "date" }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true, mode: "date" }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ownerId: varchar("owner_id")
      .notNull()
      .references(() => TB_users.id),
  },
  "cat",
);

// Relations
export const catalog_relations = relations(TB_catalogs, ({ many, one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_catalogs.organizationId],
    references: [TB_organizations.id],
  }),
  products: many(TB_catalog_products),
  owner: one(TB_users, {
    fields: [TB_catalogs.ownerId],
    references: [TB_users.id],
  }),
}));

// Schemas for validation
export const CatalogCreateSchema = object({
  ...omit(createInsertSchema(TB_catalogs), ["createdAt", "updatedAt", "organizationId", "deletedAt", "id", "ownerId"])
    .entries,
});

export const CatalogUpdateSchema = object({
  ...partial(CatalogCreateSchema).entries,
  id: prefixed_cuid2,
});

// Type exports
export type CatalogSelect = typeof TB_catalogs.$inferSelect;
export type CatalogInsert = typeof TB_catalogs.$inferInsert;
export type CatalogCreate = InferInput<typeof CatalogCreateSchema>;
export type CatalogUpdate = InferInput<typeof CatalogUpdateSchema>;
