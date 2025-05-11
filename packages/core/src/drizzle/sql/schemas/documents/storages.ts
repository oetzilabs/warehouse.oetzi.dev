import { relations } from "drizzle-orm";
import { text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_documents } from "./documents";
import { TB_document_storage_offers } from "./storage_offers";
import { TB_documents_storage_queue } from "./storage_queue";

export const TB_document_storages = commonTable(
  "document_storages",
  {
    name: text("name").notNull(),
    description: text("description"),
    offer_id: varchar("offer_id")
      .notNull()
      .references(() => TB_document_storage_offers.id, {
        onDelete: "cascade",
      }),
  },
  "ds"
);

export const document_storage_relations = relations(TB_document_storages, ({ one, many }) => ({
  documents: many(TB_documents),
  queuedDocuments: many(TB_documents_storage_queue),
  offer: one(TB_document_storage_offers, {
    fields: [TB_document_storages.offer_id],
    references: [TB_document_storage_offers.id],
  }),
}));

export type DocumentStorageSelect = typeof TB_document_storages.$inferSelect;
export type DocumentStorageInsert = typeof TB_document_storages.$inferInsert;
export const DocumentStorageCreateSchema = omit(createInsertSchema(TB_document_storages), ["createdAt", "updatedAt"]);
export const DocumentStorageUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_document_storages), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});

export type DocumentStorageCreate = InferInput<typeof DocumentStorageCreateSchema>;
export type DocumentStorageUpdate = InferInput<typeof DocumentStorageUpdateSchema>;
