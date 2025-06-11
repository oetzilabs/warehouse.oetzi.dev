import { relations } from "drizzle-orm";
import { decimal, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_products } from "../products/products";
import { TB_tax_groups } from "../taxes/tax_group";
import { schema } from "../utils";
import { TB_organizations } from "./organizations";

export const product_status = schema.enum("product_status", [
  "active",
  "discontinued",
  "out_of_stock",
  "recalled",
  "pending_review",
]);

export const product_condition = schema.enum("product_condition", ["new", "used", "refurbished", "damaged", "expired"]);

export const TB_organizations_products = schema.table(
  "organizations_products",
  (t) => ({
    organizationId: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    productId: t
      .varchar("product_id")
      .references(() => TB_products.id, { onDelete: "cascade" })
      .notNull(),
    // Status & Condition
    status: product_status("status").default("active").notNull(),
    condition: product_condition("condition").default("new").notNull(),

    // Inventory Control
    minimumStock: t.integer("minimum_stock").notNull().default(0),
    maximumStock: t.integer("maximum_stock"),
    reorderPoint: t.integer("reorder_point"),

    // Pricing & Costs
    purchasePrice: decimal("purchase_price", { precision: 10, scale: 2, mode: "number" }),
    sellingPrice: decimal("selling_price", { precision: 10, scale: 2, mode: "number" }).notNull(),
    msrp: decimal("msrp", { precision: 10, scale: 2, mode: "number" }),
    currency: t.text("currency").notNull(),

    default_tax_group_id: t.text("default_tax_group_id").references(() => TB_tax_groups.id),
    createdAt: t.timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: t.timestamp("updated_at", { withTimezone: true, mode: "date" }),
    deletedAt: t.timestamp("deleted_at", { withTimezone: true, mode: "date" }),
  }),
  (table) => [primaryKey({ columns: [table.organizationId, table.productId] })],
);

export const organizations_products_relations = relations(TB_organizations_products, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organizations_products.organizationId],
    references: [TB_organizations.id],
  }),
  product: one(TB_products, {
    fields: [TB_organizations_products.productId],
    references: [TB_products.id],
  }),
  tg: one(TB_tax_groups, {
    fields: [TB_organizations_products.default_tax_group_id],
    references: [TB_tax_groups.id],
  }),
}));

export type OrganizationProductSelect = typeof TB_organizations_products.$inferSelect;
export type OrganizationProductInsert = typeof TB_organizations_products.$inferInsert;
export const OrganizationProductCreateSchema = object({
  ...omit(createInsertSchema(TB_organizations_products), ["createdAt", "updatedAt", "deletedAt"]).entries,
});
export const OrganizationProductUpdateSchema = object({
  ...partial(OrganizationProductCreateSchema).entries,
  productId: prefixed_cuid2,
  organizationId: prefixed_cuid2,
});
