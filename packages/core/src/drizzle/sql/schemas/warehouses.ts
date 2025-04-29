import { relations } from "drizzle-orm";
import { text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { commonTable } from "./entity";
import { schema } from "./utils";
import { TB_warehouse_types } from "./warehouse_types";

export const TB_warehouses = commonTable(
  "warehouses",
  {
    name: text("name").notNull(),
    description: text("description"),
    address: text("address").notNull(),
    type: varchar("type")
      .notNull()
      .references(() => TB_warehouse_types.id, { onDelete: "cascade" }),
  },
  "warehouse",
);

export const warehouse_relation = relations(TB_warehouses, ({ many }) => ({
  // Add relations here when needed
}));

export type WarehouseSelect = typeof TB_warehouses.$inferSelect;
export type WarehouseInsert = typeof TB_warehouses.$inferInsert;
export const WarehouseCreateSchema = omit(createInsertSchema(TB_warehouses), ["createdAt", "updatedAt"]);
export const WarehouseUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_warehouses), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
