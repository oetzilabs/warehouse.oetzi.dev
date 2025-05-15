import { relations } from "drizzle-orm";
import { decimal, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_customers } from "../customers";
import { commonTable } from "../entity";
import { TB_sale_items } from "../sales/sales_items";
import { TB_users } from "../users/users";
import { schema } from "../utils";
import { TB_warehouses } from "../warehouses/warehouses";

export const sale_status = schema.enum("sale_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const TB_sales = commonTable(
  "sales",
  {
    customerId: text("customer_id")
      .references(() => TB_customers.id)
      .notNull(),
    warehouseId: text("warehouse_id")
      .references(() => TB_warehouses.id)
      .notNull(),
    status: sale_status("status").default("pending").notNull(),
    note: text("note"),
    total: decimal("total", { precision: 10, scale: 2, mode: "number" }).notNull().default(0),
  },
  "sale",
);

export const sales_relations = relations(TB_sales, ({ one, many }) => ({
  customer: one(TB_users, {
    fields: [TB_sales.customerId],
    references: [TB_users.id],
  }),
  warehouse: one(TB_warehouses, {
    fields: [TB_sales.warehouseId],
    references: [TB_warehouses.id],
  }),
  items: many(TB_sale_items),
}));

export type SaleSelect = typeof TB_sales.$inferSelect;
export type SaleInsert = typeof TB_sales.$inferInsert;
export const SaleCreateSchema = createInsertSchema(TB_sales);
export const SaleUpdateSchema = object({
  ...partial(omit(SaleCreateSchema, ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
