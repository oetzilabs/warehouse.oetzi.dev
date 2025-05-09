import { relations } from "drizzle-orm";
import { primaryKey, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput } from "valibot";
import { schema } from "../utils";
import { TB_document_storage_feature } from "./storage_feature";
import { TB_document_storage_feature_sets } from "./storage_feature_sets";

export const TB_document_storage_feature_feature_sets = schema.table(
  "document_storage_feature_feature_sets",
  {
    feature_id: varchar("feature_id")
      .notNull()
      .references(() => TB_document_storage_feature.id),
    feature_set_id: varchar("feature_set_id")
      .notNull()
      .references(() => TB_document_storage_feature_sets.id),
  },
  (table) => primaryKey({ columns: [table.feature_id, table.feature_set_id] }),
);

export const document_storage_feature_feature_sets_relations = relations(
  TB_document_storage_feature_feature_sets,
  ({ one }) => ({
    feature: one(TB_document_storage_feature, {
      fields: [TB_document_storage_feature_feature_sets.feature_id],
      references: [TB_document_storage_feature.id],
    }),
    feature_set: one(TB_document_storage_feature_sets, {
      fields: [TB_document_storage_feature_feature_sets.feature_set_id],
      references: [TB_document_storage_feature_sets.id],
    }),
  }),
);

export type DocumentStorageFeatureFeatureSetsSelect = typeof TB_document_storage_feature_feature_sets.$inferSelect;
export type DocumentStorageFeatureFeatureSetsInsert = typeof TB_document_storage_feature_feature_sets.$inferInsert;
export const DocumentStorageFeatureFeatureSetsCreateSchema = createInsertSchema(
  TB_document_storage_feature_feature_sets,
);

export type DocumentStorageFeatureFeatureSetsCreate = InferInput<typeof DocumentStorageFeatureFeatureSetsCreateSchema>;
