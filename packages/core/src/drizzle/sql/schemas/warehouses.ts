import { relations } from "drizzle-orm";
import { AnyPgColumn, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { TB_addresses } from "./address";
import { commonTable } from "./entity";
import { TB_warehouse_types } from "./warehouse_types";
import { TB_warehouse_addresses } from "./warehouses_addresses";

export const TB_warehouses = commonTable(
  "warehouses",
  {
    name: text("name").notNull(),
    description: text("description"),
    address_id: varchar("address").references(() => TB_addresses.id, { onDelete: "cascade" }),
    type: varchar("type")
      .notNull()
      .references(() => TB_warehouse_types.id, { onDelete: "cascade" }),
  },
  "warehouse",
);

export const warehouse_relation = relations(TB_warehouses, ({ many }) => ({
  addresses: many(TB_warehouse_addresses),
}));

export type WarehouseSelect = typeof TB_warehouses.$inferSelect;
export type WarehouseInsert = typeof TB_warehouses.$inferInsert;
export const WarehouseCreateSchema = omit(createInsertSchema(TB_warehouses), ["createdAt", "updatedAt"]);
export const WarehouseUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_warehouses), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
