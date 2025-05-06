import { relations } from "drizzle-orm";
import { integer, json, numeric, point, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { commonTable } from "./entity";
import { TB_organizations } from "./organizations";
import { TB_organization_addresses } from "./organizations_addresses";
import { TB_warehouse_addresses } from "./warehouses_addresses";

export const TB_addresses = commonTable(
  "addresses",
  {
    street: text("street").notNull(),
    house_number: text("house_number").notNull(),
    additional: text("additional"),
    postal_code: text("postal_code").notNull(),
    city: text("city").notNull(),
    state: text("state"),
    country: text("country").notNull(),
    lat: numeric("lat", { mode: "number" }).notNull(),
    lon: numeric("lon", { mode: "number" }).notNull(),
  },
  "addr",
);

export const addresses_relation = relations(TB_addresses, ({ many }) => ({
  organizations: many(TB_organization_addresses),
  warehouses: many(TB_warehouse_addresses),
}));

export type AddressSelect = typeof TB_addresses.$inferSelect;
export type AddressInsert = typeof TB_addresses.$inferInsert;

export const AddressCreateSchema = omit(createInsertSchema(TB_addresses), ["createdAt", "updatedAt"]);
export const AddressUpdateSchema = object({
  ...partial(AddressCreateSchema).entries,
  id: prefixed_cuid2,
});
