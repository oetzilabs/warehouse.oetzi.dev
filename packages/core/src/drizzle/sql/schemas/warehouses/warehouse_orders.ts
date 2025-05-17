import { relations } from "drizzle-orm";
import { varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { commonTable } from "../entity";
import { TB_orders } from "../orders/orders";
import { TB_warehouses } from "./warehouses";

export const TB_warehouse_orders = commonTable(
  "warehouse_orders",
  {
    warehouseId: varchar("warehouse_id")
      .references(() => TB_warehouses.id, { onDelete: "cascade" })
      .notNull(),
    orderId: varchar("order_id")
      .references(() => TB_orders.id, { onDelete: "cascade" })
      .notNull(),
  },
  "wh_ord",
);

export const warehouse_orders_relations = relations(TB_warehouse_orders, ({ one }) => ({
  warehouse: one(TB_warehouses, {
    fields: [TB_warehouse_orders.warehouseId],
    references: [TB_warehouses.id],
  }),
  order: one(TB_orders, {
    fields: [TB_warehouse_orders.orderId],
    references: [TB_orders.id],
  }),
}));

export type WarehouseOrderSelect = typeof TB_warehouse_orders.$inferSelect;
export type WarehouseOrderInsert = typeof TB_warehouse_orders.$inferInsert;
export const WarehouseOrderCreateSchema = createInsertSchema(TB_warehouse_orders);
export type WarehouseOrderCreate = InferInput<typeof WarehouseOrderCreateSchema>;
