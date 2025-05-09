import { relations } from "drizzle-orm";
import { boolean, numeric, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_document_storage_offers_feature_sets } from "./storage_offers_feature_sets";
import { TB_document_storages } from "./storages";

export const TB_document_storage_offers = commonTable(
  "document_storage_offers",
  {
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { mode: "number" }).notNull().default(0),
    maxSize: numeric("max_size", { mode: "number" }).notNull().default(0),
    maxQueueSize: numeric("max_queue_size", { mode: "number" }).notNull().default(0),
    shareable: boolean("shareable").notNull().default(false),
  },
  "dso",
);

export const document_storage_offer_relations = relations(TB_document_storage_offers, ({ one, many }) => ({
  featureSets: many(TB_document_storage_offers_feature_sets),
  storages: many(TB_document_storages),
}));

export type DocumentStorageOfferSelect = typeof TB_document_storage_offers.$inferSelect;
export type DocumentStorageOfferInsert = typeof TB_document_storage_offers.$inferInsert;
export const DocumentStorageOfferCreateSchema = omit(createInsertSchema(TB_document_storage_offers), [
  "createdAt",
  "updatedAt",
  "deletedAt",
]);
export const DocumentStorageOfferUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_document_storage_offers), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});

export type DocumentStorageOfferCreate = InferInput<typeof DocumentStorageOfferCreateSchema>;
export type DocumentStorageOfferUpdate = InferInput<typeof DocumentStorageOfferUpdateSchema>;
