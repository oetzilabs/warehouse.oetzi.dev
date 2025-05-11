import { relations } from "drizzle-orm";
import { json, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_document_storage_feature_feature_sets } from "./storage_feature_feature_sets";
import { TB_document_storage_offers } from "./storage_offers";

export const TB_document_storage_feature = commonTable(
  "document_feature",
  {
    name: text("name").notNull(),
    description: text("description"),
  },
  "dfs",
);

export const document_feature_relations = relations(TB_document_storage_feature, ({ many }) => ({
  offers: many(TB_document_storage_offers),
  feature_sets: many(TB_document_storage_feature_feature_sets),
}));

export type DocumentStorageFeatureSelect = typeof TB_document_storage_feature.$inferSelect;
export type DocumentStorageFeatureInsert = typeof TB_document_storage_feature.$inferInsert;
export const DocumentStorageFeatureCreateSchema = omit(createInsertSchema(TB_document_storage_feature), [
  "createdAt",
  "updatedAt",
]);
export const DocumentStorageFeatureUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_document_storage_feature), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});

export type DocumentStorageFeatureCreate = InferInput<typeof DocumentStorageFeatureCreateSchema>;
export type DocumentStorageFeatureUpdate = InferInput<typeof DocumentStorageFeatureUpdateSchema>;
