import { relations } from "drizzle-orm";
import { primaryKey, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { schema } from "../utils";
import { TB_products } from "./products";

export const TB_product_labels = commonTable(
  "product_labels",
  {
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").default("#000000"),
    image: text("image"),
  },
  "labl",
);

export const TB_products_to_labels = schema.table(
  "products_to_labels",
  {
    productId: text("product_id")
      .notNull()
      .references(() => TB_products.id),
    labelId: text("label_id")
      .notNull()
      .references(() => TB_product_labels.id),
  },
  (table) => [primaryKey({ columns: [table.productId, table.labelId] })],
);

export const product_labels_relations = relations(TB_product_labels, ({ many }) => ({
  products: many(TB_products_to_labels),
}));

export const products_to_labels_relations = relations(TB_products_to_labels, ({ one }) => ({
  product: one(TB_products, {
    fields: [TB_products_to_labels.productId],
    references: [TB_products.id],
  }),
  label: one(TB_product_labels, {
    fields: [TB_products_to_labels.labelId],
    references: [TB_product_labels.id],
  }),
}));

export type ProductLabelSelect = typeof TB_product_labels.$inferSelect;
export type ProductLabelInsert = typeof TB_product_labels.$inferInsert;
export const ProductLabelCreateSchema = createInsertSchema(TB_product_labels);
export const ProductLabelUpdateSchema = object({
  ...partial(omit(ProductLabelCreateSchema, ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
