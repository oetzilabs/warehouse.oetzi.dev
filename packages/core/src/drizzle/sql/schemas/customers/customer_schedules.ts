import { relations } from "drizzle-orm";
import { primaryKey, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_customers } from "../customers/customers";
import { TB_schedules } from "../schedules/schedules";
import { schema } from "../utils";
import { TB_customer_orders } from "./customer_orders";

export const schedule_type = schema.enum("schedule_type", [
  "delivery", // We deliver
  "pickup", // Customer picks up
]);

export const schedule_status = schema.enum("schedule_status", [
  "scheduled", // Future event
  "preparing", // Warehouse is preparing
  "ready", // Ready for delivery/pickup
  "completed", // Done
  "cancelled", // Cancelled
]);

export const TB_customer_schedules = schema.table(
  "customer_schedules",
  (t) => ({
    customerId: t
      .varchar("customer_id")
      .notNull()
      .references(() => TB_customers.id),
    scheduleId: t
      .varchar("schedule_id")
      .notNull()
      .references(() => TB_schedules.id),
    orderId: t.varchar("order_id").references(() => TB_customer_orders.id),
    type: schedule_type("type").notNull(),
  }),
  (table) => [primaryKey({ columns: [table.customerId, table.scheduleId, table.orderId] })],
);

export const customer_schedules_relations = relations(TB_customer_schedules, ({ one }) => ({
  customer: one(TB_customers, {
    fields: [TB_customer_schedules.customerId],
    references: [TB_customers.id],
  }),
  schedule: one(TB_schedules, {
    fields: [TB_customer_schedules.scheduleId],
    references: [TB_schedules.id],
  }),
  order: one(TB_customer_orders, {
    fields: [TB_customer_schedules.orderId],
    references: [TB_customer_orders.id],
  }),
}));

export type CustomerScheduleSelect = typeof TB_customer_schedules.$inferSelect;
export type CustomerScheduleInsert = typeof TB_customer_schedules.$inferInsert;

export const CustomerScheduleCreateSchema = createInsertSchema(TB_customer_schedules);

export const CustomerScheduleUpdateSchema = object({
  ...partial(CustomerScheduleCreateSchema).entries,
  id: prefixed_cuid2,
});

export type CustomerScheduleCreate = InferInput<typeof CustomerScheduleCreateSchema>;
export type CustomerScheduleUpdate = InferInput<typeof CustomerScheduleUpdateSchema>;
