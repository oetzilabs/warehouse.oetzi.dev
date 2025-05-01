import { relations } from "drizzle-orm";
import { varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { TB_addresses } from "./address";
import { commonTable } from "./entity";
import { TB_organizations } from "./organizations";

export const TB_organization_addresses = commonTable(
  "organization_addresses",
  {
    organization_id: varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    address_id: varchar("address_id")
      .references(() => TB_addresses.id, { onDelete: "cascade" })
      .notNull(),
  },
  "org_addr",
);
export const organization_addresses_relation = relations(TB_organization_addresses, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organization_addresses.organization_id],
    references: [TB_organizations.id],
  }),
  address: one(TB_addresses, {
    fields: [TB_organization_addresses.address_id],
    references: [TB_addresses.id],
  }),
}));

export type OrganizationAddressInsert = typeof TB_organization_addresses.$inferInsert;
export type OrganizationAddressSelect = typeof TB_organization_addresses.$inferSelect;

export const OrganizationAddressCreateSchema = omit(createInsertSchema(TB_organization_addresses), [
  "createdAt",
  "updatedAt",
]);
export const OrganizationAddressUpdateSchema = object({
  ...partial(OrganizationAddressCreateSchema).entries,
  id: prefixed_cuid2,
});
