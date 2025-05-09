import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit } from "valibot";
import { TB_payment_methods } from "./payment_methods";
import { TB_users } from "./users";
import { schema } from "./utils";

export const TB_user_payment_methods = schema.table(
  "user_payment_methods",
  (t) => ({
    user_id: t
      .varchar("user_id")
      .notNull()
      .references(() => TB_users.id, { onDelete: "cascade" }),
    payment_method_id: t
      .varchar("payment_method_id")
      .notNull()
      .references(() => TB_payment_methods.id, { onDelete: "cascade" }),
  }),
  (table) => [primaryKey({ columns: [table.user_id, table.payment_method_id] })],
);

export const user_payment_method_relations = relations(TB_user_payment_methods, ({ one }) => ({
  user: one(TB_users, {
    fields: [TB_user_payment_methods.user_id],
    references: [TB_users.id],
  }),
  payment_method: one(TB_payment_methods, {
    fields: [TB_user_payment_methods.payment_method_id],
    references: [TB_payment_methods.id],
  }),
}));

export type UserPaymentMethodSelect = typeof TB_user_payment_methods.$inferSelect;
export type UserPaymentMethodInsert = typeof TB_user_payment_methods.$inferInsert;
export const UserPaymentMethodCreateSchema = createInsertSchema(TB_user_payment_methods);
export const UserPaymentMethodUpdateSchema = createInsertSchema(TB_user_payment_methods);
