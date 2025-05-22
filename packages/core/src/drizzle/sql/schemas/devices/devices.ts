import { relations } from "drizzle-orm";
import { text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { schema } from "../utils";
import { TB_warehouse_facilities } from "../warehouses/warehouse_facility";

export const device_status = schema.enum("device_status", [
  "online",
  "offline",
  "unresponsive",
  "unknown",
  "shutting-down",
  "rebooting",
  "maintenance",
  "error",
]);

export const TB_devices = commonTable(
  "devices",
  {
    name: text("name").notNull(),
    description: text("description"),
    status: device_status("status").default("unknown").notNull(),
    type: text("type").notNull(),
    facility_id: varchar("facility_id").references(() => TB_warehouse_facilities.id, { onDelete: "set null" }),
  },
  "device",
);

export const device_relations = relations(TB_devices, ({ one, many }) => ({
  facility: one(TB_warehouse_facilities, {
    fields: [TB_devices.facility_id],
    references: [TB_warehouse_facilities.id],
  }),
}));

export type DeviceSelect = typeof TB_devices.$inferSelect;
export type DeviceInsert = typeof TB_devices.$inferInsert;
export const DeviceCreateSchema = omit(createInsertSchema(TB_devices), ["createdAt", "updatedAt", "deletedAt", "id"]);
export const DeviceUpdateSchema = object({
  ...partial(DeviceCreateSchema).entries,
  id: prefixed_cuid2,
});
