import { relations } from "drizzle-orm";
import { varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_addresses } from "../address";
import { commonTable } from "../entity";
import { TB_warehouses } from "../warehouses/warehouses";

export const TB_warehouse_addresses = commonTable(
  "warehouse_addresses",
  {
    warehouse_id: varchar("warehouse_id")
      .references(() => TB_warehouses.id, { onDelete: "cascade" })
      .notNull(),
    address_id: varchar("address_id")
      .references(() => TB_addresses.id, { onDelete: "cascade" })
      .notNull(),
  },
  "wh_addr",
);

export const warehouse_addresses_relation = relations(TB_warehouse_addresses, ({ one }) => ({
  warehouse: one(TB_warehouses, {
    fields: [TB_warehouse_addresses.warehouse_id],
    references: [TB_warehouses.id],
  }),
  address: one(TB_addresses, {
    fields: [TB_warehouse_addresses.address_id],
    references: [TB_addresses.id],
  }),
}));

export type WarehouseAddressInsert = typeof TB_warehouse_addresses.$inferInsert;
export type WarehouseAddressSelect = typeof TB_warehouse_addresses.$inferSelect;

export const WarehouseAddressCreateSchema = omit(createInsertSchema(TB_warehouse_addresses), [
  "createdAt",
  "updatedAt",
]);
export const WarehouseAddressUpdateSchema = object({
  ...partial(WarehouseAddressCreateSchema).entries,
  id: prefixed_cuid2,
});
