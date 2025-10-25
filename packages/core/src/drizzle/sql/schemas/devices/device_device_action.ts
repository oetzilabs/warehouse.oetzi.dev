import { relations } from "drizzle-orm";
import { primaryKey, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { schema } from "../utils";
import { TB_device_actions } from "./device_actions";
import { TB_devices } from "./devices";

export const TB_device_device_actions = schema.table(
  "device_device_actions",
  {
    device_id: varchar("device_id")
      .references(() => TB_devices.id, { onDelete: "cascade" })
      .notNull(),
    action_id: varchar("action_id")
      .references(() => TB_device_actions.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.device_id, table.action_id] })],
);

export const device_device_actions_relation = relations(TB_device_device_actions, ({ one }) => ({
  device: one(TB_devices, {
    fields: [TB_device_device_actions.device_id],
    references: [TB_devices.id],
  }),
  action: one(TB_device_actions, {
    fields: [TB_device_device_actions.action_id],
    references: [TB_device_actions.id],
  }),
}));

export type DeviceDeviceActionInsert = typeof TB_device_device_actions.$inferInsert;
export type DeviceDeviceActionSelect = typeof TB_device_device_actions.$inferSelect;

export const DeviceDeviceActionCreateSchema = createInsertSchema(TB_device_device_actions);
export const DeviceDeviceActionUpdateSchema = DeviceDeviceActionCreateSchema;
