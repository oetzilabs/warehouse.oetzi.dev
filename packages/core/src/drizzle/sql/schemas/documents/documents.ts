import { relations } from "drizzle-orm";
import { numeric, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_document_storages } from "./storages";

export const TB_documents = commonTable(
  "documents",
  {
    name: text("name").notNull(),
    path: text("path").notNull(),
    previewPath: text("preview_path"),
    type: text("type").notNull().default("unknown"),
    size: numeric("size", { mode: "number" }).notNull().default(0),
    storage_id: varchar("storage_id")
      .notNull()
      .references(() => TB_document_storages.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  "doc",
);

export const document_relations = relations(TB_documents, ({ one }) => ({
  storage: one(TB_document_storages, {
    fields: [TB_documents.storage_id],
    references: [TB_document_storages.id],
  }),
}));

export type DocumentSelect = typeof TB_documents.$inferSelect;
export type DocumentInsert = typeof TB_documents.$inferInsert;
export const DocumentCreateSchema = omit(createInsertSchema(TB_documents), ["createdAt", "updatedAt"]);
export const DocumentUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_documents), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
