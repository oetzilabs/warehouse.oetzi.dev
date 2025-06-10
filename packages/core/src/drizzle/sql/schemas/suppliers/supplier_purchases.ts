import { relations } from "drizzle-orm";
import { text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_organizations } from "../organizations/organizations";
import { schema } from "../utils";
import { TB_supplier_purchase_products } from "./supplier_purchase_products";
import { TB_suppliers } from "./suppliers";

export const supplier_purchase_status = schema.enum("supplier_purchase_status", [
  "draft",
  "pending",
  "processing",
  "completed",
  "cancelled",
]);

export const TB_supplier_purchases = commonTable(
  "supplier_purchases",
  {
    status: supplier_purchase_status("status").notNull().default("pending"),
    barcode: varchar("barcode").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    organization_id: varchar("organization_id")
      .references(() => TB_organizations.id)
      .notNull(),
    supplier_id: varchar("supplier_id")
      .references(() => TB_suppliers.id)
      .notNull(),
  },
  "spurch",
);

export const supplier_purchase_relations = relations(TB_supplier_purchases, ({ one, many }) => ({
  organization: one(TB_organizations, {
    fields: [TB_supplier_purchases.organization_id],
    references: [TB_organizations.id],
  }),
  supplier: one(TB_suppliers, {
    fields: [TB_supplier_purchases.supplier_id],
    references: [TB_suppliers.id],
  }),
  products: many(TB_supplier_purchase_products),
}));

export type SupplierPurchaseSelect = typeof TB_supplier_purchases.$inferSelect;
export type SupplierPurchaseInsert = typeof TB_supplier_purchases.$inferInsert;
export const SupplierPurchaseCreateSchema = omit(createInsertSchema(TB_supplier_purchases), [
  "createdAt",
  "updatedAt",
  "deletedAt",
  "organization_id",
]);
export type SupplierPurchaseCreate = InferInput<typeof SupplierPurchaseCreateSchema>;
export const SupplyPurchaseUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_supplier_purchases), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
