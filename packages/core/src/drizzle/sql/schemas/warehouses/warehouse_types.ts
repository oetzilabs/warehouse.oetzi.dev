import { relations } from "drizzle-orm";
import { index, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_warehouses } from "../warehouses/warehouses";

export const TB_warehouse_types = commonTable(
  "warehouse_types",
  {
    name: text("name").notNull(),
    description: text("description"),
    code: text("code").notNull(), // for programmatic reference, e.g., "storage", "retail", etc.
    image: text("image"),
  },
  "wht",
  (table) => [index("idx_warehouse_types_name").on(table.name)],
);

export const warehouse_type_relations = relations(TB_warehouse_types, ({ many }) => ({
  warehouses: many(TB_warehouses),
}));

export type WarehouseTypeSelect = typeof TB_warehouse_types.$inferSelect;
export type WarehouseTypeInsert = typeof TB_warehouse_types.$inferInsert;
export const WarehouseTypeCreateSchema = omit(createInsertSchema(TB_warehouse_types), ["createdAt", "updatedAt"]);
export const WarehouseTypeUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_warehouse_types), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
