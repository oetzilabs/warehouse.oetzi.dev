import { relations } from "drizzle-orm";
import { primaryKey, varchar } from "drizzle-orm/pg-core";
import { TB_storage_conditions } from "../storages/storage_conditions";
import { schema } from "../utils";
import { TB_products } from "./products";

export const TB_products_to_storage_conditions = schema.table(
  "products_to_storage_conditions",
  (t) => ({
    productId: varchar("product_id")
      .references(() => TB_products.id, { onDelete: "cascade" })
      .notNull(),
    conditionId: varchar("condition_id")
      .references(() => TB_storage_conditions.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.productId, t.conditionId] })],
);

export const products_to_storage_conditions_relations = relations(TB_products_to_storage_conditions, ({ one }) => ({
  product: one(TB_products, {
    fields: [TB_products_to_storage_conditions.productId],
    references: [TB_products.id],
  }),
  condition: one(TB_storage_conditions, {
    fields: [TB_products_to_storage_conditions.conditionId],
    references: [TB_storage_conditions.id],
  }),
}));
