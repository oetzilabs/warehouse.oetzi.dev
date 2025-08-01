import { relations } from "drizzle-orm";
import { boolean, index, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_tax_rates } from "../taxes/tax_rates";
import { schema } from "../utils";
import { TB_tax_groups } from "./tax_group";

export const TB_tax_group_countryrates = schema.table(
  "tax_group_coutryrates",
  (t) => ({
    country_code: t.varchar("country_code").notNull(),
    taxGroupId: t
      .varchar("tax_group_id")
      .references(() => TB_tax_groups.id, { onDelete: "cascade" })
      .notNull(),
    taxRateId: t
      .varchar("tax_rate_id")
      .references(() => TB_tax_rates.id, { onDelete: "cascade" })
      .notNull(),
    effective_date: timestamp("effective_date", { mode: "date" }).defaultNow().notNull(),
    expiration_date: timestamp("expiration_date", { mode: "date" }),
  }),
  (table) => [
    primaryKey({ columns: [table.taxGroupId, table.taxRateId] }),
    index("idx_country_code").on(table.country_code),
  ],
);

export const tax_group_coutryrates_relations = relations(TB_tax_group_countryrates, ({ one, many }) => ({
  tg: one(TB_tax_groups, {
    fields: [TB_tax_group_countryrates.taxGroupId],
    references: [TB_tax_groups.id],
  }),
  tr: one(TB_tax_rates, {
    fields: [TB_tax_group_countryrates.taxRateId],
    references: [TB_tax_rates.id],
  }),
}));

export type TaxGroupCountryRatesSelect = typeof TB_tax_group_countryrates.$inferSelect;
export type TaxGroupCountryRatesInsert = typeof TB_tax_group_countryrates.$inferInsert;
export const TaxGroupCountryRatesCreateSchema = createInsertSchema(TB_tax_group_countryrates);
export const TaxGroupCountryRatesUpdateSchema = object({
  ...partial(TaxGroupCountryRatesCreateSchema).entries,
  id: prefixed_cuid2,
});
