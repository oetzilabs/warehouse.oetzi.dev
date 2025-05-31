import { relations } from "drizzle-orm";
import { text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_product_to_images } from "../products/product_to_images";
import { schema } from "../utils";

export const TB_images = commonTable(
  "images",
  {
    url: text("url").notNull(),
    alt: text("alt"),
    title: text("title"),
    description: text("description"),
  },
  "img",
);

export const images_relations = relations(TB_images, ({ one, many }) => ({
  products: many(TB_product_to_images),
}));

export type ImageSelect = typeof TB_images.$inferSelect;
export type ImageInsert = typeof TB_images.$inferInsert;
export const ImageCreateSchema = omit(createInsertSchema(TB_images), ["createdAt", "updatedAt", "deletedAt", "id"]);
export const ImageUpdateSchema = object({
  ...partial(ImageCreateSchema).entries,
  id: prefixed_cuid2,
});

export type ImageCreate = InferInput<typeof ImageCreateSchema>;
export type ImageUpdate = InferInput<typeof ImageUpdateSchema>;
