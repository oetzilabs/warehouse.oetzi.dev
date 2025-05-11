import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { schema } from "../utils";
import { TB_warehouses } from "../warehouses/warehouses";
import { TB_organizations } from "./organizations";

export const TB_organizations_warehouses = schema.table(
  "organizations_warehouses",
  (t) => ({
    organizationId: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    warehouseId: t
      .varchar("warehouse_id")
      .references(() => TB_warehouses.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (table) => [primaryKey({ columns: [table.organizationId, table.warehouseId] })],
);

export const organizations_warehouses_relations = relations(TB_organizations_warehouses, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organizations_warehouses.organizationId],
    references: [TB_organizations.id],
  }),
  warehouse: one(TB_warehouses, {
    fields: [TB_organizations_warehouses.warehouseId],
    references: [TB_warehouses.id],
  }),
}));

export type OrganizationWarehouseSelect = typeof TB_organizations_warehouses.$inferSelect;
export type OrganizationWarehouseInsert = typeof TB_organizations_warehouses.$inferInsert;
export const OrganizationWarehouseCreateSchema = createInsertSchema(TB_organizations_warehouses);
export const OrganizationWarehouseUpdateSchema = object({
  ...partial(OrganizationWarehouseCreateSchema).entries,
  id: prefixed_cuid2,
});
