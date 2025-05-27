import { relations } from "drizzle-orm";
import { timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import { InferInput, object, partial, string } from "valibot";
import { commonTable } from "../entity";
import { schema } from "../utils";
import { TB_customers } from "./customers";

export const TB_customer_preferred_deliverytimes = commonTable(
  "customer_preferred_deliverytimes",
  {
    customerId: varchar("customer_id")
      .notNull()
      .references(() => TB_customers.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true, mode: "date" }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true, mode: "date" }), // Optional end time
    notes: varchar("notes"),
  },
  "cppt",
);

export const customer_preferred_deliverytimes_relations = relations(TB_customer_preferred_deliverytimes, ({ one }) => ({
  customer: one(TB_customers, {
    fields: [TB_customer_preferred_deliverytimes.customerId],
    references: [TB_customers.id],
  }),
}));

export type CustomerPreferredDeliveryTimeSelect = typeof TB_customer_preferred_deliverytimes.$inferSelect;
export type CustomerPreferredDeliveryTimeInsert = typeof TB_customer_preferred_deliverytimes.$inferInsert;

export const CustomerPreferredDeliveryTimeCreateSchema = createInsertSchema(TB_customer_preferred_deliverytimes);
export const CustomerPreferredDeliveryTimeSelectSchema = createSelectSchema(TB_customer_preferred_deliverytimes);

export const CustomerPreferredDeliveryTimeUpdateSchema = object({
  ...partial(CustomerPreferredDeliveryTimeCreateSchema).entries,
  id: string(),
});

export type CustomerPreferredDeliveryTimeCreate = InferInput<typeof CustomerPreferredDeliveryTimeCreateSchema>;
export type CustomerPreferredDeliveryTimeUpdate = InferInput<typeof CustomerPreferredDeliveryTimeUpdateSchema>;
