import { relations } from "drizzle-orm";
import { AnyPgColumn, index, integer, json, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_storage_to_labels, TB_storage_to_products, TB_warehouse_areas } from "../../schema";
import { commonTable } from "../entity";
import { schema } from "../utils";
import { TB_storage_types } from "./storage_types";

export const storage_variant = schema.enum("storage_variant", ["horizontal", "vertical"]);

export const TB_storages = commonTable(
  "storages",
  {
    parentId: varchar("parent_id").references((): AnyPgColumn => TB_storages.id, { onDelete: "cascade" }),
    warehouseAreaId: varchar("warehouse_area_id").references(() => TB_warehouse_areas.id, { onDelete: "cascade" }),
    typeId: varchar("type_id")
      .references(() => TB_storage_types.id, { onDelete: "cascade" })
      .notNull(),

    name: text("name").notNull(),
    description: text("description"),
    capacity: integer("capacity").notNull(),
    variant: storage_variant("variant").notNull().default("horizontal"),
    barcode: varchar("barcode", { length: 128 }).unique(),
    bounding_box: json("bounding_box").notNull().$type<{
      x: number;
      y: number;
      width: number;
      height: number;
      depth: number;
    }>(),
  },
  "storage",
  (table) => [index("idx_storages_name").on(table.name), index("idx_storages_barcode").on(table.barcode)],
);

export const storage_relations = relations(TB_storages, ({ one, many }) => ({
  parent: one(TB_storages, {
    fields: [TB_storages.parentId],
    references: [TB_storages.id],
    relationName: "storages",
  }),
  children: many(TB_storages, {
    relationName: "storages",
  }),
  area: one(TB_warehouse_areas, {
    fields: [TB_storages.warehouseAreaId],
    references: [TB_warehouse_areas.id],
  }),
  type: one(TB_storage_types, {
    fields: [TB_storages.typeId],
    references: [TB_storage_types.id],
  }),
  labels: many(TB_storage_to_labels),
  products: many(TB_storage_to_products),
}));

export type StorageSelect = typeof TB_storages.$inferSelect;
export type StorageInsert = typeof TB_storages.$inferInsert;
export const StorageCreateSchema = omit(createInsertSchema(TB_storages), ["createdAt", "updatedAt"]);
export const StorageUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_storages), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
