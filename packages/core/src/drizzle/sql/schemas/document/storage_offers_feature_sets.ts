import { relations } from "drizzle-orm";
import { primaryKey, varchar } from "drizzle-orm/pg-core";
import { schema } from "../utils";
import { TB_document_storage_feature_sets } from "./storage_feature_sets";
import { TB_document_storage_offers } from "./storage_offers";

export const TB_document_storage_offers_feature_sets = schema.table(
  "document_storage_offers_feature_sets",
  {
    storage_offer_id: varchar("storage_offer_id")
      .notNull()
      .references(() => TB_document_storage_offers.id),
    feature_set_id: varchar("feature_set_id")
      .notNull()
      .references(() => TB_document_storage_feature_sets.id),
  },
  (table) => [primaryKey({ columns: [table.storage_offer_id, table.feature_set_id] })],
);

export const TB_document_storage_offers_feature_sets_relations = relations(
  TB_document_storage_offers_feature_sets,
  ({ one }) => ({
    storage_offer: one(TB_document_storage_offers, {
      fields: [TB_document_storage_offers_feature_sets.storage_offer_id],
      references: [TB_document_storage_offers.id],
    }),
    feature_set: one(TB_document_storage_feature_sets, {
      fields: [TB_document_storage_offers_feature_sets.feature_set_id],
      references: [TB_document_storage_feature_sets.id],
    }),
  }),
);
