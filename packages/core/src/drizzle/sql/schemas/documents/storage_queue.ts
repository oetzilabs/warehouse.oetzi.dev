import { relations } from "drizzle-orm";
import { varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { schema } from "../utils";
import { TB_documents } from "./documents";
import { TB_document_storages } from "./storages";

export const document_storage_queue_status = schema.enum("document_storage_queue_status", [
  "pending",
  "processing",
  "done",
  "failed",
]);

export const TB_documents_storage_queue = commonTable(
  "documents_storage_queue",
  {
    document_id: varchar("document_id")
      .notNull()
      .references(() => TB_documents.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    storage_id: varchar("storage_id")
      .notNull()
      .references(() => TB_document_storages.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    status: document_storage_queue_status("status").notNull().default("pending"),
  },
  "dsq",
);

export const document_storage_queue_relations = relations(TB_documents_storage_queue, ({ one, many }) => ({
  document: one(TB_documents, {
    fields: [TB_documents_storage_queue.document_id],
    references: [TB_documents.id],
  }),
  storage: one(TB_document_storages, {
    fields: [TB_documents_storage_queue.storage_id],
    references: [TB_document_storages.id],
  }),
}));

export type DocumentStorageQueueSelect = typeof TB_documents_storage_queue.$inferSelect;
export type DocumentStorageQueueInsert = typeof TB_documents_storage_queue.$inferInsert;
export const DocumentStorageQueueCreateSchema = omit(createInsertSchema(TB_documents_storage_queue), [
  "createdAt",
  "updatedAt",
]);
export const DocumentStorageQueueUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_documents_storage_queue), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});

export type DocumentStorageQueueCreate = InferInput<typeof DocumentStorageQueueCreateSchema>;
