import { relations } from "drizzle-orm";
import { text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_organizations } from "../organizations/organizations";
import { TB_sales } from "../sales/sales";
import { TB_user_orders } from "../users/user_orders";
import { schema } from "../utils";
import { TB_customer_order_products } from "./customer_order_products";
import { TB_customer_schedules } from "./customer_schedules";
import { TB_customers } from "./customers";

export const customer_order_status = schema.enum("customer_order_status", [
  "pending",
  "processing",
  "completed",
  "cancelled",
  "deleted",
]);

export const TB_customer_orders = commonTable(
  "customer_orders",
  {
    status: customer_order_status("status").notNull().default("pending"),
    title: text("title").notNull(),
    description: text("description"),
    barcode: varchar("barcode").unique().notNull(),
    saleId: varchar("sale_id").references(() => TB_sales.id),
    organization_id: varchar("organization_id")
      .references(() => TB_organizations.id)
      .notNull(),
    customer_id: varchar("customer_id")
      .references(() => TB_customers.id)
      .notNull(),
  },
  "cord",
);

export const customer_order_relations = relations(TB_customer_orders, ({ one, many }) => ({
  organization: one(TB_organizations, {
    fields: [TB_customer_orders.organization_id],
    references: [TB_organizations.id],
  }),
  customer: one(TB_customers, {
    fields: [TB_customer_orders.customer_id],
    references: [TB_customers.id],
  }),
  custSched: many(TB_customer_schedules),
  users: many(TB_user_orders),
  sale: one(TB_sales, {
    fields: [TB_customer_orders.saleId],
    references: [TB_sales.id],
  }),
  products: many(TB_customer_order_products),
}));

export type CustomerOrderSelect = typeof TB_customer_orders.$inferSelect;
export type CustomerOrderInsert = typeof TB_customer_orders.$inferInsert;
export const CustomerOrderCreateSchema = omit(createInsertSchema(TB_customer_orders), [
  "createdAt",
  "updatedAt",
  "deletedAt",
  "organization_id",
]);
export type CustomerOrderCreate = InferInput<typeof CustomerOrderCreateSchema>;
export const CustomerOrderUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_customer_orders), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
