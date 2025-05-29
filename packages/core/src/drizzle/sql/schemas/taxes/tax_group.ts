import { relations } from "drizzle-orm";
import { decimal, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_products } from "../products/products";
import { TB_tax_group_countryrates } from "./tax_group_countryrates";

export const TB_tax_groups = commonTable(
  "tax_groups",
  {
    name: text("name").notNull(),
    description: text("description"),
  },
  "taxgroup",
);

export const tax_groups_relations = relations(TB_tax_groups, ({ many }) => ({
  products: many(TB_products),
  crs: many(TB_tax_group_countryrates),
}));

export type TaxGroupSelect = typeof TB_tax_groups.$inferSelect;
export type TaxGroupInsert = typeof TB_tax_groups.$inferInsert;
export const TaxGroupCreateSchema = omit(createInsertSchema(TB_tax_groups), [
  "id",
  "createdAt",
  "updatedAt",
  "deletedAt",
]);
export const TaxGroupUpdateSchema = object({
  ...partial(TaxGroupCreateSchema).entries,
  id: prefixed_cuid2,
});
