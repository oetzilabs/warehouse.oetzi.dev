import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { TB_users } from "./users";
import { schema } from "./utils";
import { TB_warehouses } from "./warehouses";

export const TB_users_warehouses = schema.table(
  "users_warehouses",
  (t) => ({
    userId: t
      .varchar("user_id")
      .references(() => TB_users.id, { onDelete: "cascade" })
      .notNull(),
    warehouseId: t
      .varchar("warehouse_id")
      .references(() => TB_warehouses.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (table) => [primaryKey({ columns: [table.userId, table.warehouseId] })],
);

export const users_warehouses_relations = relations(TB_users_warehouses, ({ one }) => ({
  user: one(TB_users, {
    fields: [TB_users_warehouses.userId],
    references: [TB_users.id],
  }),
  warehouse: one(TB_warehouses, {
    fields: [TB_users_warehouses.warehouseId],
    references: [TB_warehouses.id],
  }),
}));

export type UserWarehouseSelect = typeof TB_users_warehouses.$inferSelect;
export type UserWarehouseInsert = typeof TB_users_warehouses.$inferInsert;
export const UserWarehouseCreateSchema = createInsertSchema(TB_users_warehouses);
export const UserWarehouseUpdateSchema = object({
  ...partial(UserWarehouseCreateSchema).entries,
  id: prefixed_cuid2,
});
