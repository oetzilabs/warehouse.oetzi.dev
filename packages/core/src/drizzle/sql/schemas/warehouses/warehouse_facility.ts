import { relations } from "drizzle-orm";
import { json, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_warehouse_areas } from "./warehouse_areas";
import { TB_warehouses } from "./warehouses";

export const TB_warehouse_facilities = commonTable(
  "warehouse_facilities",
  {
    name: text("name").notNull(),
    description: text("description"),
    bounding_box: json("bounding_box").$type<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>(),
    warehouse_id: text("warehouse_id")
      .notNull()
      .references(() => TB_warehouses.id, { onDelete: "cascade" }),
  },
  "whfc",
);

export const warehouse_facilities_relations = relations(TB_warehouse_facilities, ({ one, many }) => ({
  warehouse: one(TB_warehouses, {
    fields: [TB_warehouse_facilities.warehouse_id],
    references: [TB_warehouses.id],
  }),
  areas: many(TB_warehouse_areas),
}));

export type WarehouseFacilitySelect = typeof TB_warehouse_facilities.$inferSelect;
export type WarehouseFacilityInsert = typeof TB_warehouse_facilities.$inferInsert;
export const WarehouseFacilityCreateSchema = omit(createInsertSchema(TB_warehouse_facilities), [
  "createdAt",
  "updatedAt",
]);
export const WarehouseFacilityUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_warehouse_facilities), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
