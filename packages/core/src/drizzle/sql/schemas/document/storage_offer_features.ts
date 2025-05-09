import { relations } from "drizzle-orm";
import { varchar } from "drizzle-orm/pg-core";
import { commonTable } from "../entity";
import { TB_document_storage_feature_sets } from "./storage_feature_sets";
import { TB_document_storage_offers } from "./storage_offers";

export const TB_offer_features = commonTable(
  "offer_features",
  {
    offer_id: varchar("offer_id")
      .notNull()
      .references(() => TB_document_storage_offers.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    feature_set_id: varchar("feature_set_id")
      .notNull()
      .references(() => TB_document_storage_feature_sets.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  "of",
);

export const offer_features_relations = relations(TB_offer_features, ({ one }) => ({
  offer: one(TB_document_storage_offers, {
    fields: [TB_offer_features.offer_id],
    references: [TB_document_storage_offers.id],
  }),
  featureSet: one(TB_document_storage_feature_sets, {
    fields: [TB_offer_features.feature_set_id],
    references: [TB_document_storage_feature_sets.id],
  }),
}));
