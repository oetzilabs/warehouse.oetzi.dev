import { relations } from "drizzle-orm";
import { primaryKey, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_suppliers } from "../suppliers/suppliers";
import { schema } from "../utils";
import { TB_warehouses } from "./warehouses";

export const TB_warehouse_suppliers = schema.table(
  "warehouse_suppliers",
  {
    warehouse_id: varchar("warehouse_id")
      .references(() => TB_warehouses.id, { onDelete: "cascade" })
      .notNull(),
    supplier_id: varchar("supplier_id")
      .references(() => TB_suppliers.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.warehouse_id, table.supplier_id] })],
);

export const warehouse_suppliers_relation = relations(TB_warehouse_suppliers, ({ one }) => ({
  warehouse: one(TB_warehouses, {
    fields: [TB_warehouse_suppliers.warehouse_id],
    references: [TB_warehouses.id],
  }),
  supplier: one(TB_suppliers, {
    fields: [TB_warehouse_suppliers.supplier_id],
    references: [TB_suppliers.id],
  }),
}));

export type WarehouseSupplierInsert = typeof TB_warehouse_suppliers.$inferInsert;
export type WarehouseSupplierSelect = typeof TB_warehouse_suppliers.$inferSelect;

export const WarehouseSupplierCreateSchema = createInsertSchema(TB_warehouse_suppliers);
export const WarehouseSupplierUpdateSchema = WarehouseSupplierCreateSchema;
