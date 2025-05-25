import { relations } from "drizzle-orm";
import { primaryKey, text } from "drizzle-orm/pg-core";
import { TB_certificates } from "../certificates/certificates";
import { TB_products } from "../products/products";
import { schema } from "../utils";
import { TB_storages } from "./storages";

export const TB_storage_products = schema.table(
  "storage_products",
  {
    productId: text("product_id")
      .notNull()
      .references(() => TB_products.id),
    storageId: text("storage_id")
      .notNull()
      .references(() => TB_storages.id),
  },
  (table) => [primaryKey({ columns: [table.productId, table.storageId] })],
);

export const storage_products_relations = relations(TB_storage_products, ({ one }) => ({
  product: one(TB_products, {
    fields: [TB_storage_products.productId],
    references: [TB_products.id],
  }),
  storage: one(TB_storages, {
    fields: [TB_storage_products.storageId],
    references: [TB_storages.id],
  }),
}));
