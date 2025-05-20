import { relations } from "drizzle-orm";
import { decimal, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_products_to_storage_conditions } from "../products/products_to_storage_conditions";
import { schema } from "../utils";

export const TB_storage_conditions = commonTable(
  "storage_conditions",
  {
    name: text("name").notNull(),
    description: text("description"),
    temperatureMin: decimal("temperature_min", { precision: 5, scale: 2 }),
    temperatureMax: decimal("temperature_max", { precision: 5, scale: 2 }),
    humidityMin: decimal("humidity_min", { precision: 5, scale: 2 }),
    humidityMax: decimal("humidity_max", { precision: 5, scale: 2 }),
    lightLevelMin: decimal("light_level_min", { precision: 5, scale: 2 }),
    lightLevelMax: decimal("light_level_max", { precision: 5, scale: 2 }),
  },
  "stcond",
);

export const storage_conditions_relations = relations(TB_storage_conditions, ({ many }) => ({
  products: many(TB_products_to_storage_conditions),
}));

export type StorageConditionSelect = typeof TB_storage_conditions.$inferSelect;
export type StorageConditionInsert = typeof TB_storage_conditions.$inferInsert;
export const StorageConditionCreateSchema = omit(createInsertSchema(TB_storage_conditions), [
  "createdAt",
  "updatedAt",
  "id",
]);
export const StorageConditionUpdateSchema = object({
  ...partial(StorageConditionCreateSchema).entries,
  id: prefixed_cuid2,
});

export type StorageConditionCreate = InferInput<typeof StorageConditionCreateSchema>;
export type StorageConditionUpdate = InferInput<typeof StorageConditionUpdateSchema>;
