import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { TB_products } from "../products/products";
import { schema } from "../utils";
import { TB_storages } from "./storages";

export const TB_storage_to_products = schema.table(
  "storage_to_products",
  (t) => ({
    id: t
      .varchar("id")
      .notNull()
      .$defaultFn(() => `sspp_${createId()}`),
    productId: t
      .varchar("product_id")
      .notNull()
      .references(() => TB_products.id),
    storageId: t
      .varchar("storage_id")
      .notNull()
      .references(() => TB_storages.id),
  }),
  (table) => [primaryKey({ columns: [table.id, table.productId, table.storageId] })],
);

export const storage_products_relations = relations(TB_storage_to_products, ({ one }) => ({
  product: one(TB_products, {
    fields: [TB_storage_to_products.productId],
    references: [TB_products.id],
  }),
  storage: one(TB_storages, {
    fields: [TB_storage_to_products.storageId],
    references: [TB_storages.id],
  }),
}));
