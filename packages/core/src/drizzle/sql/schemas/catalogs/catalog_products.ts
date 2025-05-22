import { relations } from "drizzle-orm";
import { decimal, primaryKey } from "drizzle-orm/pg-core";
import { TB_products } from "../products/products";
import { schema } from "../utils";
import { TB_catalogs } from "./catalogs";

export const TB_catalog_products = schema.table(
  "catalog_products",
  (t) => ({
    catalogId: t
      .text("catalog_id")
      .notNull()
      .references(() => TB_catalogs.id),
    productId: t
      .text("product_id")
      .notNull()
      .references(() => TB_products.id),
    discount: decimal("discount", { precision: 10, scale: 2, mode: "number" }).default(0).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.catalogId, t.productId] })],
);

export const catalog_products_relations = relations(TB_catalog_products, ({ one }) => ({
  catalog: one(TB_catalogs, {
    fields: [TB_catalog_products.catalogId],
    references: [TB_catalogs.id],
  }),
  product: one(TB_products, {
    fields: [TB_catalog_products.productId],
    references: [TB_products.id],
  }),
}));
