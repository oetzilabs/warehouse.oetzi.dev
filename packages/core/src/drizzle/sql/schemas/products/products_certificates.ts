import { relations } from "drizzle-orm";
import { primaryKey, text } from "drizzle-orm/pg-core";
import { TB_certificates } from "../certificates/certificates";
import { schema } from "../utils";
import { TB_products } from "./products";

export const TB_products_to_certifications = schema.table(
  "products_to_certifications",
  {
    productId: text("product_id")
      .notNull()
      .references(() => TB_products.id),
    certificationId: text("certification_id")
      .notNull()
      .references(() => TB_certificates.id),
  },
  (table) => [primaryKey({ columns: [table.productId, table.certificationId] })],
);

export const products_to_certifications_relations = relations(TB_products_to_certifications, ({ one }) => ({
  product: one(TB_products, {
    fields: [TB_products_to_certifications.productId],
    references: [TB_products.id],
  }),
  cert: one(TB_certificates, {
    fields: [TB_products_to_certifications.certificationId],
    references: [TB_certificates.id],
  }),
}));
