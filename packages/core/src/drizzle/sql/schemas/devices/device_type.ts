import { relations } from "drizzle-orm";
import { index, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { schema } from "../utils";
import { TB_devices } from "./devices";

export const TB_device_types = commonTable(
  "device_types",
  {
    name: text("name").notNull(),
    code: varchar("code").notNull(),
    description: text("description"),
  },
  "devicetype",
  (table) => [index("idx_device_name").on(table.name), index("idx_device_code").on(table.code)],
);

export const device_type_relations = relations(TB_device_types, ({ many }) => ({
  devices: many(TB_devices),
}));

export type DeviceTypeSelect = typeof TB_device_types.$inferSelect;
export type DeviceTypeInsert = typeof TB_device_types.$inferInsert;
export const DeviceTypeCreateSchema = omit(createInsertSchema(TB_device_types), [
  "createdAt",
  "updatedAt",
  "deletedAt",
  "id",
]);
export const DeviceTypeUpdateSchema = object({
  ...partial(DeviceTypeCreateSchema).entries,
  id: prefixed_cuid2,
});
