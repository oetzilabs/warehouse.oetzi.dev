import { relations } from "drizzle-orm";
import { text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_document_storage_feature } from "./storage_feature";
import { TB_document_storage_feature_feature_sets } from "./storage_feature_feature_sets";
import { TB_document_storage_offers_feature_sets } from "./storage_offers_feature_sets";

export const TB_document_storage_feature_sets = commonTable(
  "feature_sets",
  {
    name: text("name").notNull(),
    description: text("description"),
  },
  "fs",
);

export const document_storage_feature_sets_relations = relations(TB_document_storage_feature_sets, ({ many }) => ({
  storage_offers: many(TB_document_storage_offers_feature_sets),
  features: many(TB_document_storage_feature_feature_sets),
}));

export type DocumentFeatureSetSelect = typeof TB_document_storage_feature_sets.$inferSelect;
export type DocumentFeatureSetInsert = typeof TB_document_storage_feature_sets.$inferInsert;
export const DocumentFeatureSetCreateSchema = omit(createInsertSchema(TB_document_storage_feature_sets), [
  "createdAt",
  "updatedAt",
]);
export const DocumentFeatureSetUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_document_storage_feature_sets), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});

export type DocumentFeatureSetCreate = InferInput<typeof DocumentFeatureSetCreateSchema>;
export type DocumentFeatureSetUpdate = InferInput<typeof DocumentFeatureSetUpdateSchema>;
