import { relations } from "drizzle-orm";
import { json, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_devices } from "../devices/devices";
import { commonTable } from "../entity";
import { TB_sessions } from "../sessions";
import { TB_users } from "../users/users";
import { TB_warehouse_areas } from "./warehouse_areas";
import { TB_warehouses } from "./warehouses";

export const TB_warehouse_facilities = commonTable(
  "warehouse_facilities",
  {
    name: text("name").notNull(),
    description: text("description"),
    bounding_box: json("bounding_box").$type<{
      x: number;
      y: number;
      width: number;
      height: number;
    }>(),
    warehouse_id: text("warehouse_id")
      .notNull()
      .references(() => TB_warehouses.id, { onDelete: "cascade" }),
    ownerId: text("ownerId")
      .notNull()
      .references(() => TB_users.id, { onDelete: "cascade" }),
  },
  "whfc",
);

export const warehouse_facilities_relations = relations(TB_warehouse_facilities, ({ one, many }) => ({
  warehouse: one(TB_warehouses, {
    fields: [TB_warehouse_facilities.warehouse_id],
    references: [TB_warehouses.id],
  }),
  ars: many(TB_warehouse_areas),
  user: one(TB_users, {
    fields: [TB_warehouse_facilities.ownerId],
    references: [TB_users.id],
  }),
  sessions: many(TB_sessions),
}));

export type FacilitySelect = typeof TB_warehouse_facilities.$inferSelect;
export type FacilityInsert = typeof TB_warehouse_facilities.$inferInsert;
export const FacilityCreateSchema = omit(createInsertSchema(TB_warehouse_facilities), [
  "createdAt",
  "updatedAt",
  "deletedAt",
]);
export const FacilityUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_warehouse_facilities), ["createdAt", "updatedAt", "deletedAt"])).entries,
  id: prefixed_cuid2,
});

export type FacilityCreate = InferInput<typeof FacilityCreateSchema>;
export type FacilityUpdate = InferInput<typeof FacilityUpdateSchema>;
