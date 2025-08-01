import { relations } from "drizzle-orm";
import { index, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_products_to_certifications } from "../products/products_certificates";
import { schema } from "../utils";

export const certificate_types = schema.enum("certificate_types", ["digital", "physical"]);

export const TB_certificates = commonTable(
  "certificates",
  {
    type: certificate_types("type").default("digital").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    issuer: text("issuer").notNull(),
    validityPeriod: text("validity_period"),
    certificationNumber: text("certification_number"),
  },
  "cert",
  (table) => [
    index("idx_certificates_name").on(table.name),
    index("idx_certificates_issuer").on(table.issuer),
    index("idx_certificate_number").on(table.certificationNumber),
  ],
);

export const certification_relations = relations(TB_certificates, ({ many }) => ({
  products: many(TB_products_to_certifications),
}));

export type CertificateSelect = typeof TB_certificates.$inferSelect;
export type CertificateInsert = typeof TB_certificates.$inferInsert;
export const CertificateCreateSchema = createInsertSchema(TB_certificates);
export const CertificateUpdateSchema = object({
  ...partial(omit(CertificateCreateSchema, ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
