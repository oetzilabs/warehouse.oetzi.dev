import { relations } from "drizzle-orm";
import { json, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_storages } from "../storages";
import { TB_warehouses } from "./warehouses";

export const TB_warehouse_areas = commonTable(
  "warehouse_areas",
  {
    name: text("name").notNull(),
    description: text("description"),
    bounding_box: json("bounding_box").notNull().$type<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>(),
    warehouse_id: text("warehouse_id")
      .notNull()
      .references(() => TB_warehouses.id, { onDelete: "cascade" }),
  },
  "wha",
);

export const warehouse_area_relations = relations(TB_warehouse_areas, ({ one, many }) => ({
  warehouse: one(TB_warehouses, {
    fields: [TB_warehouse_areas.warehouse_id],
    references: [TB_warehouses.id],
  }),
  storages: many(TB_storages),
}));

export type WarehouseAreaSelect = typeof TB_warehouse_areas.$inferSelect;
export type WarehouseAreaInsert = typeof TB_warehouse_areas.$inferInsert;
export const WarehouseAreaCreateSchema = omit(createInsertSchema(TB_warehouse_areas), ["createdAt", "updatedAt"]);
export const WarehouseAreaUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_warehouse_areas), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
