import { or, relations } from "drizzle-orm";
import { decimal, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_customers } from "../customers/customers";
import { commonTable } from "../entity";
import { TB_orders } from "../orders/orders";
import { TB_organizations } from "../organizations/organizations";
import { TB_sale_items } from "../sales/sales_items";
import { TB_users } from "../users/users";
import { schema } from "../utils";
import { TB_sales_discounts } from "./sales_discounts";

export const sale_status = schema.enum("sale_status", [
  "created",
  "draft",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "deleted",
]);

export const TB_sales = commonTable(
  "sales",
  {
    customerId: text("customer_id")
      .references(() => TB_customers.id)
      .notNull(),
    organizationId: text("organization_id")
      .references(() => TB_organizations.id)
      .notNull(),
    status: sale_status("status").default("draft").notNull(),
    note: text("note"),
  },
  "sale",
);

export const sales_relations = relations(TB_sales, ({ one, many }) => ({
  customer: one(TB_customers, {
    fields: [TB_sales.customerId],
    references: [TB_customers.id],
  }),
  organization: one(TB_organizations, {
    fields: [TB_sales.organizationId],
    references: [TB_organizations.id],
  }),
  items: many(TB_sale_items),
  orders: many(TB_orders),
  discounts: many(TB_sales_discounts),
}));

export type SaleSelect = typeof TB_sales.$inferSelect;
export type SaleInsert = typeof TB_sales.$inferInsert;
export const SaleCreateSchema = omit(createInsertSchema(TB_sales), ["createdAt", "updatedAt", "deletedAt"]);
export const SaleUpdateSchema = object({
  ...partial(SaleCreateSchema).entries,
  id: prefixed_cuid2,
});
