import { relations } from "drizzle-orm";
import { timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import { InferInput, object, partial, string } from "valibot";
import { commonTable } from "../entity";
import { schema } from "../utils";
import { TB_customers } from "./customers";

export const TB_customer_preferred_pickuptimes = commonTable(
  "customer_preferred_pickuptimes",
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

export const customer_preferred_pickuptimes_relations = relations(TB_customer_preferred_pickuptimes, ({ one }) => ({
  customer: one(TB_customers, {
    fields: [TB_customer_preferred_pickuptimes.customerId],
    references: [TB_customers.id],
  }),
}));

export type CustomerPreferredPickupTimeSelect = typeof TB_customer_preferred_pickuptimes.$inferSelect;
export type CustomerPreferredPickupTimeInsert = typeof TB_customer_preferred_pickuptimes.$inferInsert;

export const CustomerPreferredPickupTimeCreateSchema = createInsertSchema(TB_customer_preferred_pickuptimes);
export const CustomerPreferredPickupTimeSelectSchema = createSelectSchema(TB_customer_preferred_pickuptimes);

export const CustomerPreferredPickupTimeUpdateSchema = object({
  ...partial(CustomerPreferredPickupTimeCreateSchema).entries,
  id: string(),
});

export type CustomerPreferredPickupTimeCreate = InferInput<typeof CustomerPreferredPickupTimeCreateSchema>;
export type CustomerPreferredPickupTimeUpdate = InferInput<typeof CustomerPreferredPickupTimeUpdateSchema>;
