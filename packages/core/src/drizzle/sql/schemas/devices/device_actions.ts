import { relations } from "drizzle-orm";
import { index, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { schema } from "../utils";
import { TB_device_device_actions } from "./device_device_action";

export const TB_device_actions = commonTable(
  "device_actions",
  {
    name: text("name").notNull(),
    description: text("description"),
    executable: varchar("file").notNull(),
  },
  "deviceaction",
);

export const device_action_relations = relations(TB_device_actions, ({ many }) => ({
  devices: many(TB_device_device_actions),
}));

export type DeviceActionSelect = typeof TB_device_actions.$inferSelect;
export type DeviceActionInsert = Omit<
  typeof TB_device_actions.$inferInsert,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;
export type DeviceActionUpdate = Omit<
  typeof TB_device_actions.$inferInsert,
  "createdAt" | "updatedAt" | "deletedAt"
> & {
  id: string;
};

export const DeviceActionCreateSchema = omit(createInsertSchema(TB_device_actions), [
  "createdAt",
  "updatedAt",
  "deletedAt",
  "id",
]);

export const DeviceActionUpdateSchema = object({
  ...partial(DeviceActionCreateSchema).entries,
  id: prefixed_cuid2,
});
