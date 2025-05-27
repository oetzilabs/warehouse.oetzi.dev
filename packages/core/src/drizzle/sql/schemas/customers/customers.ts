import { relations } from "drizzle-orm";
import { text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_orders } from "../orders/orders";
import { TB_organization_customers } from "../organizations/organization_customers";
import { TB_organizations_customerorders } from "../organizations/organizations_orders";
import { TB_sales } from "../sales/sales";
import { schema } from "../utils";
import { TB_customer_notes } from "./customer_notes";
import { TB_customer_preferred_deliverytimes } from "./customer_preferred_deliverytimes";
import { TB_customer_preferred_pickuptimes } from "./customer_preferred_pickuptimes";
import { TB_customer_schedules } from "./customer_schedules";

export const customer_status = schema.enum("customer_status", ["active", "inactive", "blocked"]);

export const TB_customers = commonTable(
  "customers",
  {
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    image: text("image"),
    status: customer_status("status").default("active").notNull(),
    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  "cust",
);

export const customer_relations = relations(TB_customers, ({ many, one }) => ({
  sales: many(TB_sales),
  organizations: many(TB_organization_customers),
  orgOrders: many(TB_organizations_customerorders),
  notes: many(TB_customer_notes),
  schedules: many(TB_customer_schedules),
  ppt: many(TB_customer_preferred_pickuptimes),
  pdt: many(TB_customer_preferred_deliverytimes),
}));

export type CustomerSelect = typeof TB_customers.$inferSelect;
export type CustomerInsert = typeof TB_customers.$inferInsert;
export const CustomerCreateSchema = omit(createInsertSchema(TB_customers), [
  "createdAt",
  "updatedAt",
  "deletedAt",
  "id",
  "verifiedAt",
]);
export const CustomerUpdateSchema = object({
  ...partial(CustomerCreateSchema).entries,
  id: prefixed_cuid2,
});
export type CustomerCreate = InferInput<typeof CustomerCreateSchema>;
export type CustomerUpdate = InferInput<typeof CustomerUpdateSchema>;
