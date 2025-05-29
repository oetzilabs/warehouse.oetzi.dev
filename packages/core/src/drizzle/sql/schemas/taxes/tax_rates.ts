import { relations } from "drizzle-orm";
import { decimal, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_tax_group_countryrates } from "./tax_group_countryrates";

export const TB_tax_rates = commonTable(
  "tax_rates",
  {
    rate: decimal("rate", { mode: "number" }).notNull(),
  },
  "tax",
);

export const tax_rates_relations = relations(TB_tax_rates, ({ many }) => ({
  countryRates: many(TB_tax_group_countryrates),
}));

export type TaxRateSelect = typeof TB_tax_rates.$inferSelect;
export type TaxRateInsert = typeof TB_tax_rates.$inferInsert;
export const TaxRateCreateSchema = omit(createInsertSchema(TB_tax_rates), [
  "id",
  "createdAt",
  "updatedAt",
  "deletedAt",
]);
export const TaxRateUpdateSchema = object({
  ...partial(TaxRateCreateSchema).entries,
  id: prefixed_cuid2,
});
