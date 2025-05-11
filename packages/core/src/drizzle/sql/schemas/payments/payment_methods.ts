import { relations } from "drizzle-orm";
import { boolean, pgEnum, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_user_payment_methods } from "../users/user_payment_methods";
import { TB_payment_history } from "./payment_history";

export const payment_method_type = pgEnum("payment_method_type", ["cash", "card", "bank_account"]);
export type PaymentMethodType = (typeof payment_method_type.enumValues)[number];

export const TB_payment_methods = commonTable(
  "payment_methods",
  {
    type: payment_method_type("type").notNull(),
    provider: text("provider").notNull().default("stripe"),
    disabled: boolean("disabled").notNull().default(false),
  },
  "pm",
);

export const payment_method_relations = relations(TB_payment_methods, ({ many }) => ({
  users: many(TB_user_payment_methods),
  payment_history: many(TB_payment_history),
}));

export type PaymentMethodSelect = typeof TB_payment_methods.$inferSelect;
export type PaymentMethodInsert = typeof TB_payment_methods.$inferInsert;
export const PaymentMethodCreateSchema = object({
  ...omit(createInsertSchema(TB_payment_methods), ["createdAt", "updatedAt"]).entries,
});
export const PaymentMethodUpdateSchema = object({
  ...PaymentMethodCreateSchema.entries,
  id: prefixed_cuid2,
});
export type PaymentMethodCreate = InferInput<typeof PaymentMethodCreateSchema>;
export type PaymentMethodUpdate = InferInput<typeof PaymentMethodUpdateSchema>;
