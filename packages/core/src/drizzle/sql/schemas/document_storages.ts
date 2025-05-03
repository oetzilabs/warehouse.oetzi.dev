import { relations } from "drizzle-orm";
import { pgEnum, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { TB_documents } from "./documents";
import { commonTable } from "./entity";
import { TB_organizations } from "./organizations";

export const document_storage_type = pgEnum("document_storage_type", ["local", "remote:s3", "remote:http"]);

export const TB_document_storages = commonTable(
  "document_storages",
  {
    name: text("name").notNull(),
    description: text("description"),
    path: text("path").notNull(),
    type: document_storage_type("type").notNull().default("remote:s3"),
    organization_id: varchar("organization_id")
      .notNull()
      .references(() => TB_organizations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  "ds",
);

export const document_storage_relations = relations(TB_document_storages, ({ one, many }) => ({
  organization: one(TB_organizations, {
    fields: [TB_document_storages.organization_id],
    references: [TB_organizations.id],
  }),
  documents: many(TB_documents),
}));

export type DocumentStorageSelect = typeof TB_document_storages.$inferSelect;
export type DocumentStorageInsert = typeof TB_document_storages.$inferInsert;
export const DocumentStorageCreateSchema = omit(createInsertSchema(TB_document_storages), [
  "createdAt",
  "updatedAt",
  "organization_id",
  "path",
  "type",
]);
export const DocumentStorageUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_document_storages), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});

export type DocumentStorageCreate = InferInput<typeof DocumentStorageCreateSchema>;
export type DocumentStorageUpdate = InferInput<typeof DocumentStorageUpdateSchema>;
