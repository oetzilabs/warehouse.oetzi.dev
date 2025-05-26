import { relations } from "drizzle-orm";
import { integer, jsonb, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_customer_schedules } from "../customers/customer_schedules";
import { commonTable } from "../entity";
import { schema } from "../utils";

export const reoccurrence_type = schema.enum("reoccurrence_type", [
  "none",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "semimonthly",
  "quarterly",
  "yearly",
  "custom",
]);

export const TB_schedules = commonTable(
  "schedules",
  {
    scheduleStart: timestamp("schedule_start", { mode: "date" }).notNull(),
    scheduleEnd: timestamp("schedule_end", { mode: "date" }).notNull(),
    reoccurrence: reoccurrence_type("reoccurrence").notNull().default("none"),
    /**
     * The interval in days for recurring schedules
     * @default 0 meaning it is not a recurring schedule, meaning its a one-time schedule
     */
    interval: integer("interval").notNull().default(0),
    until: timestamp("until", { mode: "date" }),
  },
  "sch",
);

export const schedule_relations = relations(TB_schedules, ({ one, many }) => ({
  customers: many(TB_customer_schedules),
}));

export type ScheduleSelect = typeof TB_schedules.$inferSelect;
export type ScheduleInsert = typeof TB_schedules.$inferInsert;

// Validation schemas
export const ScheduleCreateSchema = omit(createInsertSchema(TB_schedules), ["createdAt", "updatedAt", "deletedAt"]);

export const ScheduleUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_schedules), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
