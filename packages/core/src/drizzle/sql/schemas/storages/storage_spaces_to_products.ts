import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { TB_products } from "../products/products";
import { schema } from "../utils";
import { TB_storage_spaces } from "./storage_space";

export const TB_storage_spaces_to_products = schema.table(
  "storage_space_to_products",
  (t) => ({
    id: t
      .varchar("id")
      .notNull()
      .$defaultFn(() => `sspp_${createId()}`),
    productId: t
      .varchar("product_id")
      .notNull()
      .references(() => TB_products.id),
    storageSpaceId: t
      .varchar("storage_space_id")
      .notNull()
      .references(() => TB_storage_spaces.id),
  }),
  (table) => [primaryKey({ columns: [table.id, table.productId, table.storageSpaceId] })],
);

export const storage_products_relations = relations(TB_storage_spaces_to_products, ({ one }) => ({
  pr: one(TB_products, {
    fields: [TB_storage_spaces_to_products.productId],
    references: [TB_products.id],
  }),
  storage: one(TB_storage_spaces, {
    fields: [TB_storage_spaces_to_products.storageSpaceId],
    references: [TB_storage_spaces.id],
  }),
}));
