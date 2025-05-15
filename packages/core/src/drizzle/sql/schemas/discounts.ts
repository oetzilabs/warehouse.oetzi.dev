import { relations } from "drizzle-orm";
import { boolean, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { commonTable } from "./entity";
import { TB_organization_discounts } from "./organizations/organization_discounts";
import { TB_sales_discounts } from "./sales/sales_discounts";
import { schema } from "./utils";

export const discount_target = schema.enum("discount_target", ["product", "category", "customer"]);
export const discount_type = schema.enum("discount_type", ["percentage", "fixed_amount", "buy_x_get_y"]);

export const TB_discounts_v1 = commonTable(
  "discounts_v1",
  {
    /* THIS CODE HAS TO BE GENERATED */
    code: text("code").notNull().unique(),
    active: boolean("active").default(true).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    canBeCombined: boolean("can_be_combined").default(false),
    target: discount_target("target").notNull(),
    type: discount_type("type").notNull(),
    value: numeric("value", { precision: 10, scale: 2, mode: "number" }),
    minimumQuantity: numeric("minimum_quantity", { mode: "number" }),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
  },
  "discv1",
);

export const discount_v1_relations = relations(TB_discounts_v1, ({ many }) => ({
  salesDiscounts: many(TB_sales_discounts),
  organizations: many(TB_organization_discounts),
}));

export type DiscountV1Select = typeof TB_discounts_v1.$inferSelect;
export type DiscountV1Insert = typeof TB_discounts_v1.$inferInsert;
export const DiscountV1CreateSchema = createInsertSchema(TB_discounts_v1);
export const DiscountV1UpdateSchema = object({
  ...partial(omit(DiscountV1CreateSchema, ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
