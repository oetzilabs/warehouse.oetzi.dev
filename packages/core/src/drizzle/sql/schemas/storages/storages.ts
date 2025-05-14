import { relations } from "drizzle-orm";
import { integer, json, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_warehouse_areas } from "../../schema";
import { commonTable } from "../entity";
import { TB_warehouses } from "../warehouses/warehouses";
import { TB_storage_inventory } from "./storage_inventory";
import { TB_storage_types } from "./storage_types";

export const TB_storages = commonTable(
  "storages",
  {
    warehouseAreaId: varchar("warehouse_area_id")
      .references(() => TB_warehouse_areas.id, { onDelete: "cascade" })
      .notNull(),
    typeId: varchar("type_id")
      .references(() => TB_storage_types.id, { onDelete: "cascade" })
      .notNull(),

    name: text("name").notNull(),
    description: text("description"),
    capacity: integer("capacity").notNull(),
    currentOccupancy: integer("current_occupancy").default(0),
    bounding_box: json("bounding_box").notNull().$type<{
      x: number;
      y: number;
      // px
      width: number;
      // px
      height: number;
      // cm
      length: number;
    }>(),
  },
  "storage",
);

export const storage_relations = relations(TB_storages, ({ one, many }) => ({
  area: one(TB_warehouse_areas, {
    fields: [TB_storages.warehouseAreaId],
    references: [TB_warehouse_areas.id],
  }),
  type: one(TB_storage_types, {
    fields: [TB_storages.typeId],
    references: [TB_storage_types.id],
  }),
  invs: many(TB_storage_inventory),
}));

export type StorageSelect = typeof TB_storages.$inferSelect;
export type StorageInsert = typeof TB_storages.$inferInsert;
export const StorageCreateSchema = omit(createInsertSchema(TB_storages), ["createdAt", "updatedAt"]);
export const StorageUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_storages), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
