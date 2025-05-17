import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_documents } from "../documents/documents";
import { schema } from "../utils";
import { TB_organizations } from "./organizations";

export const TB_organizations_documents = schema.table(
  "organizations_documents",
  (t) => ({
    organizationId: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    documentId: t
      .varchar("document_id")
      .references(() => TB_documents.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (table) => [primaryKey({ columns: [table.organizationId, table.documentId] })],
);

export const organizations_documents_relations = relations(TB_organizations_documents, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organizations_documents.organizationId],
    references: [TB_organizations.id],
  }),
  document: one(TB_documents, {
    fields: [TB_organizations_documents.documentId],
    references: [TB_documents.id],
  }),
}));

export type OrganizationDocumentSelect = typeof TB_organizations_documents.$inferSelect;
export type OrganizationDocumentInsert = typeof TB_organizations_documents.$inferInsert;
export const OrganizationDocumentCreateSchema = createInsertSchema(TB_organizations_documents);
export const OrganizationDocumentUpdateSchema = object({
  ...partial(OrganizationDocumentCreateSchema).entries,
  id: prefixed_cuid2,
});
