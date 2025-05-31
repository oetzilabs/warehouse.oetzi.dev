import { relations } from "drizzle-orm";
import { primaryKey, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_products } from "../../schema";
import { commonTable } from "../entity";
import { TB_images } from "../images/images";
import { schema } from "../utils";

export const TB_product_to_images = schema.table(
  "product_to_images",
  (t) => ({
    productId: varchar("product_id")
      .notNull()
      .references(() => TB_products.id),
    imageId: text("image_id")
      .notNull()
      .references(() => TB_images.id),
  }),
  (t) => [primaryKey({ columns: [t.productId, t.imageId] })],
);

export const product_images_relations = relations(TB_product_to_images, ({ one }) => ({
  product: one(TB_products, {
    fields: [TB_product_to_images.productId],
    references: [TB_products.id],
  }),
  image: one(TB_images, {
    fields: [TB_product_to_images.imageId],
    references: [TB_images.id],
  }),
}));

export type ProductToImageSelect = typeof TB_product_to_images.$inferSelect;
export type ProductToImageInsert = typeof TB_product_to_images.$inferInsert;
export const ProductToImageCreateSchema = createInsertSchema(TB_product_to_images);
export const ProductToImageUpdateSchema = object({
  ...partial(ProductToImageCreateSchema).entries,
  id: prefixed_cuid2,
});

export type ProductToImageCreate = InferInput<typeof ProductToImageCreateSchema>;
export type ProductToImageUpdate = InferInput<typeof ProductToImageUpdateSchema>;
