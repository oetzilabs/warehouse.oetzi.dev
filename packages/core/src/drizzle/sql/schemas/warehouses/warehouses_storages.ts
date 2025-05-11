import { relations } from "drizzle-orm";
import { primaryKey, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_storages } from "../storages";
import { schema } from "../utils";
import { TB_warehouses } from "../warehouses/warehouses";

export const TB_warehouse_storages = schema.table(
  "warehouse_storages",
  {
    warehouse_id: varchar("warehouse_id")
      .references(() => TB_warehouses.id, { onDelete: "cascade" })
      .notNull(),
    storage_id: varchar("storage_id")
      .references(() => TB_storages.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.warehouse_id, table.storage_id] })],
);

export const warehouse_storages_relation = relations(TB_warehouse_storages, ({ one }) => ({
  warehouse: one(TB_warehouses, {
    fields: [TB_warehouse_storages.warehouse_id],
    references: [TB_warehouses.id],
  }),
  storage: one(TB_storages, {
    fields: [TB_warehouse_storages.storage_id],
    references: [TB_storages.id],
  }),
}));

export type WarehouseStorageInsert = typeof TB_warehouse_storages.$inferInsert;
export type WarehouseStorageSelect = typeof TB_warehouse_storages.$inferSelect;

export const WarehouseStorageCreateSchema = createInsertSchema(TB_warehouse_storages);
export const WarehouseStorageUpdateSchema = WarehouseStorageCreateSchema;
