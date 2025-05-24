import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { TB_discounts_v1 } from "../discounts";
import { schema } from "../utils";
import { TB_organizations } from "./organizations";

export const TB_organization_discounts = schema.table(
  "org_discounts",
  (t) => ({
    organization_id: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    discount_id: t
      .varchar("discount_id")
      .references(() => TB_discounts_v1.id, { onDelete: "cascade" })
      .notNull(),
  }),
  (table) => [primaryKey({ columns: [table.organization_id, table.discount_id] })],
);

export const organization_discounts_relations = relations(TB_organization_discounts, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organization_discounts.organization_id],
    references: [TB_organizations.id],
  }),
  discount: one(TB_discounts_v1, {
    fields: [TB_organization_discounts.discount_id],
    references: [TB_discounts_v1.id],
  }),
}));
