import { relations } from "drizzle-orm";
import { json, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_customer_schedules } from "../customers/customer_schedules";
import { TB_customers } from "../customers/customers";
import { commonTable } from "../entity";
import {
  TB_organizations_customerorders,
  TB_organizations_supplierorders,
} from "../organizations/organizations_orders";
import { TB_sales } from "../sales/sales";
import { TB_user_orders } from "../users/user_orders";
import { TB_users } from "../users/users";
import { schema } from "../utils";
import { TB_order_products } from "./order_products";

export const order_status = schema.enum("order_status", ["pending", "processing", "completed", "cancelled"]);

export const TB_orders = commonTable(
  "orders",
  {
    status: order_status("status").notNull().default("pending"),
    title: text("title").notNull(),
    description: text("description"),
  },
  "ord",
);

export const order_relations = relations(TB_orders, ({ one, many }) => ({
  users: many(TB_user_orders),
  prods: many(TB_order_products),
  oco: many(TB_organizations_customerorders),
  oso: many(TB_organizations_supplierorders),
  custSched: many(TB_customer_schedules),
}));

export type OrderSelect = typeof TB_orders.$inferSelect;
export type OrderInsert = typeof TB_orders.$inferInsert;
export const OrderCreateSchema = omit(createInsertSchema(TB_orders), ["createdAt", "updatedAt", "deletedAt"]);
export type OrderCreate = InferInput<typeof OrderCreateSchema>;
export const OrderUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_orders), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
export type OrderUpdate = InferInput<typeof OrderUpdateSchema>;
