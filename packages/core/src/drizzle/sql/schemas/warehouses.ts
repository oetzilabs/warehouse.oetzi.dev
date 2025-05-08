import { relations } from "drizzle-orm";
import { AnyPgColumn, json, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { TB_addresses } from "./address";
import { commonTable } from "./entity";
import { TB_users } from "./users";
import { TB_warehouse_areas } from "./warehouse_areas";
import { TB_warehouse_types } from "./warehouse_types";
import { TB_warehouse_addresses } from "./warehouses_addresses";
import { TB_warehouse_storages } from "./warehouses_storages";

export const TB_warehouses = commonTable(
  "warehouses",
  {
    name: text("name").notNull(),
    description: text("description"),
    address_id: varchar("address").references(() => TB_addresses.id, { onDelete: "cascade" }),
    warehouse_type_id: varchar("warehouse_type_id").references(() => TB_warehouse_types.id, { onDelete: "cascade" }),
    dimensions: json("dimensions").$type<{
      width: number;
      height: number;
    }>(),
    ownerId: varchar("owner_id").references(() => TB_users.id, { onDelete: "cascade" }),
  },
  "warehouse",
);

export const warehouse_relation = relations(TB_warehouses, ({ one, many }) => ({
  addresses: many(TB_warehouse_addresses),
  storages: many(TB_warehouse_storages),
  type: one(TB_warehouse_types, {
    fields: [TB_warehouses.warehouse_type_id],
    references: [TB_warehouse_types.id],
  }),
  owner: one(TB_users, {
    fields: [TB_warehouses.ownerId],
    references: [TB_users.id],
  }),
  areas: many(TB_warehouse_areas),
}));

export type WarehouseSelect = typeof TB_warehouses.$inferSelect;
export type WarehouseInsert = typeof TB_warehouses.$inferInsert;
export const WarehouseCreateSchema = omit(createInsertSchema(TB_warehouses), ["createdAt", "updatedAt"]);
export const WarehouseCreateWithoutAddressAndTypeSchema = omit(createInsertSchema(TB_warehouses), [
  "createdAt",
  "updatedAt",
  "address_id",
  "warehouse_type_id",
]);
export type WarehouseCreate = InferInput<typeof WarehouseCreateSchema>;
export const WarehouseUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_warehouses), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
export type WarehouseUpdate = InferInput<typeof WarehouseUpdateSchema>;
