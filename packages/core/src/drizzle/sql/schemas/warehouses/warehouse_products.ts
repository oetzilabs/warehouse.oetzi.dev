import { relations } from "drizzle-orm";
import { varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { commonTable } from "../entity";
import { TB_products } from "../products/products";
import { TB_warehouses } from "./warehouses";

export const TB_warehouse_products = commonTable(
  "warehouse_products",
  {
    warehouseId: varchar("warehouse_id")
      .references(() => TB_warehouses.id, { onDelete: "cascade" })
      .notNull(),
    productId: varchar("product_id")
      .references(() => TB_products.id, { onDelete: "cascade" })
      .notNull(),
  },
  "whprod",
);

export const warehouse_products_relations = relations(TB_warehouse_products, ({ one }) => ({
  warehouse: one(TB_warehouses, {
    fields: [TB_warehouse_products.warehouseId],
    references: [TB_warehouses.id],
  }),
  product: one(TB_products, {
    fields: [TB_warehouse_products.productId],
    references: [TB_products.id],
  }),
}));

export type WarehouseProductSelect = typeof TB_warehouse_products.$inferSelect;
export type WarehouseProductInsert = typeof TB_warehouse_products.$inferInsert;
export const WarehouseProductCreateSchema = createInsertSchema(TB_warehouse_products);
export type WarehouseProductCreate = InferInput<typeof WarehouseProductCreateSchema>;
