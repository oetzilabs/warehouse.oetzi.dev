import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_document_storages } from "../documents/storages";
import { TB_organizations } from "../organizations/organizations";
import { schema } from "../utils";

export const TB_organizations_storages = schema.table(
  "organizations_storages",
  (t) => ({
    organizationId: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    storageId: t
      .varchar("storage_id")
      .references(() => TB_document_storages.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (table) => [primaryKey({ columns: [table.organizationId, table.storageId] })],
);

export const organizations_storages_relations = relations(TB_organizations_storages, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organizations_storages.organizationId],
    references: [TB_organizations.id],
  }),
  storage: one(TB_document_storages, {
    fields: [TB_organizations_storages.storageId],
    references: [TB_document_storages.id],
  }),
}));

export type OrganizationStorageSelect = typeof TB_organizations_storages.$inferSelect;
export type OrganizationStorageInsert = typeof TB_organizations_storages.$inferInsert;
export const OrganizationStorageCreateSchema = createInsertSchema(TB_organizations_storages);
export const OrganizationStorageUpdateSchema = object({
  ...partial(OrganizationStorageCreateSchema).entries,
  id: prefixed_cuid2,
});
