import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_schedules } from "../schedules/schedules";
import { schema } from "../utils";
import { TB_supplier_purchases } from "./supplier_purchases";
import { TB_suppliers } from "./suppliers";

export const supplier_schedule_type = schema.enum("supplier_schedule_type", [
  "delivery", // Supplier delivers
  "pickup", // We pickup
]);

export const supplier_schedule_status = schema.enum("supplier_schedule_status", [
  "scheduled", // Future event
  "preparing", // Supplier is preparing
  "ready", // Ready for delivery/pickup
  "completed", // Done
  "cancelled", // Cancelled
]);

export const TB_supplier_schedules = schema.table(
  "supplier_schedules",
  (t) => ({
    supplierId: t
      .varchar("supplier_id")
      .notNull()
      .references(() => TB_suppliers.id),
    scheduleId: t
      .varchar("schedule_id")
      .notNull()
      .references(() => TB_schedules.id),
    purchaseId: t.varchar("purchase_id").references(() => TB_supplier_purchases.id),
    type: supplier_schedule_type("type").notNull(),
  }),
  (table) => [primaryKey({ columns: [table.supplierId, table.scheduleId] })],
);

export const supplier_schedules_relations = relations(TB_supplier_schedules, ({ one }) => ({
  supplier: one(TB_suppliers, {
    fields: [TB_supplier_schedules.supplierId],
    references: [TB_suppliers.id],
  }),
  schedule: one(TB_schedules, {
    fields: [TB_supplier_schedules.scheduleId],
    references: [TB_schedules.id],
  }),
  purchase: one(TB_supplier_purchases, {
    fields: [TB_supplier_schedules.purchaseId],
    references: [TB_supplier_purchases.id],
  }),
}));

export type SupplierScheduleSelect = typeof TB_supplier_schedules.$inferSelect;
export type SupplierScheduleInsert = typeof TB_supplier_schedules.$inferInsert;

export const SupplierScheduleCreateSchema = createInsertSchema(TB_supplier_schedules);

export const SupplierScheduleUpdateSchema = object({
  ...partial(SupplierScheduleCreateSchema).entries,
  id: prefixed_cuid2,
});

export type SupplierScheduleCreate = InferInput<typeof SupplierScheduleCreateSchema>;
export type SupplierScheduleUpdate = InferInput<typeof SupplierScheduleUpdateSchema>;
