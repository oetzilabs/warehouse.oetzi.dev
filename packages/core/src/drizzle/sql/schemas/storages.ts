import { relations } from "drizzle-orm";
import { integer, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { commonTable } from "./entity";
import { TB_storage_types } from "./storage_types";
import { TB_warehouses } from "./warehouses";

export const TB_storages = commonTable(
  "storages",
  {
    warehouseId: varchar("warehouse_id")
      .references(() => TB_warehouses.id, { onDelete: "cascade" })
      .notNull(),
    typeId: varchar("type_id")
      .references(() => TB_storage_types.id, { onDelete: "cascade" })
      .notNull(),

    name: text("name").notNull(),
    description: text("description"),
    capacity: integer("capacity").notNull(),
    currentOccupancy: integer("current_occupancy").default(0),
    location: text("location").notNull(),
  },
  "storage",
);

export const storage_relations = relations(TB_storages, ({ one }) => ({
  warehouse: one(TB_warehouses, {
    fields: [TB_storages.warehouseId],
    references: [TB_warehouses.id],
  }),
  type: one(TB_storage_types, {
    fields: [TB_storages.typeId],
    references: [TB_storage_types.id],
  }),
}));

export type StorageSelect = typeof TB_storages.$inferSelect;
export type StorageInsert = typeof TB_storages.$inferInsert;
export const StorageCreateSchema = omit(createInsertSchema(TB_storages), ["createdAt", "updatedAt"]);
export const StorageUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_storages), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
