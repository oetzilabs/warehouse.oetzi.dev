import { relations } from "drizzle-orm";
import { decimal, pgEnum, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { commonTable } from "./entity";
import { TB_payment_methods } from "./payment_methods";
import { TB_users } from "./users";

export const payment_status = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export type PaymentStatus = (typeof payment_status.enumValues)[number];

export const TB_payment_history = commonTable(
  "payment_history",
  {
    userId: text("user_id")
      .references(() => TB_users.id)
      .notNull(),
    paymentMethodId: text("payment_method_id")
      .references(() => TB_payment_methods.id)
      .notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    status: payment_status("status").notNull().default("pending"),
    /**
     * Transaction ID from the payment provider, e.g., Polar, Stripe, etc transaction ID
     */
    transactionId: text("transaction_id"),
    description: text("description"),
    processedAt: timestamp("processed_at", { withTimezone: true, mode: "date" }),
  },
  "ph",
);

export const payment_history_relations = relations(TB_payment_history, ({ one }) => ({
  user: one(TB_users, {
    fields: [TB_payment_history.userId],
    references: [TB_users.id],
  }),
  paymentMethod: one(TB_payment_methods, {
    fields: [TB_payment_history.paymentMethodId],
    references: [TB_payment_methods.id],
  }),
}));

export type PaymentHistorySelect = typeof TB_payment_history.$inferSelect;
export type PaymentHistoryInsert = typeof TB_payment_history.$inferInsert;
export const PaymentHistoryCreateSchema = object({
  ...omit(createInsertSchema(TB_payment_history), ["createdAt", "updatedAt"]).entries,
});
export const PaymentHistoryUpdateSchema = object({
  ...PaymentHistoryCreateSchema.entries,
  id: prefixed_cuid2,
});
export type PaymentHistoryCreate = InferInput<typeof PaymentHistoryCreateSchema>;
export type PaymentHistoryUpdate = InferInput<typeof PaymentHistoryUpdateSchema>;
