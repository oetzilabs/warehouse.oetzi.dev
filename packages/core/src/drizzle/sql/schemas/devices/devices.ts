import { relations } from "drizzle-orm";
import { index, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_organizations } from "../organizations/organizations";
import { schema } from "../utils";
import { TB_warehouse_facilities } from "../warehouses/warehouse_facility";
import { TB_device_types } from "./device_type";

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

export const device_status_enum_values = device_status.enumValues;

export const TB_devices = commonTable(
  "devices",
  {
    name: text("name").notNull(),
    description: text("description"),
    status: device_status("status").default("unknown").notNull(),
    type_id: varchar("type_id")
      .references(() => TB_device_types.id, { onDelete: "restrict" })
      .notNull(),
    organization_id: varchar("organization_id")
      .notNull()
      .references(() => TB_organizations.id, { onDelete: "set null" }),
  },
  "device",
  (table) => [index("idx_devices_name").on(table.name)],
);

export const device_relations = relations(TB_devices, ({ one, many }) => ({
  type: one(TB_device_types, {
    fields: [TB_devices.type_id],
    references: [TB_device_types.id],
  }),
  organization: one(TB_organizations, {
    fields: [TB_devices.organization_id],
    references: [TB_organizations.id],
  }),
}));

export type DeviceSelect = typeof TB_devices.$inferSelect;
export type DeviceInsert = typeof TB_devices.$inferInsert;
export const DeviceCreateSchema = omit(createInsertSchema(TB_devices), ["createdAt", "updatedAt", "deletedAt", "id"]);
export const DeviceUpdateSchema = object({
  ...partial(DeviceCreateSchema).entries,
  id: prefixed_cuid2,
});
