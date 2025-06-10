import { relations } from "drizzle-orm";
import { varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { TB_customer_orders } from "../customers/customer_orders";
import { commonTable } from "../entity";
import { TB_users } from "./users";

export const TB_user_orders = commonTable(
  "user_orders",
  {
    userId: varchar("user_id")
      .references(() => TB_users.id, { onDelete: "cascade" })
      .notNull(),
    customerOrderId: varchar("customer_order_id")
      .references(() => TB_customer_orders.id, { onDelete: "cascade" })
      .notNull(),
  },
  "wh_ord",
);

export const user_orders_relations = relations(TB_user_orders, ({ one }) => ({
  user: one(TB_users, {
    fields: [TB_user_orders.userId],
    references: [TB_users.id],
  }),
  order: one(TB_customer_orders, {
    fields: [TB_user_orders.customerOrderId],
    references: [TB_customer_orders.id],
  }),
}));

export type UserOrderSelect = typeof TB_user_orders.$inferSelect;
export type UserOrderInsert = typeof TB_user_orders.$inferInsert;
export const UserOrderCreateSchema = createInsertSchema(TB_user_orders);
export type UserOrderCreate = InferInput<typeof UserOrderCreateSchema>;
