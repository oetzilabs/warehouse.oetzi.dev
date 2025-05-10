import { relations } from "drizzle-orm";
import { pgEnum, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { commonTable } from "./entity";
import { TB_sales } from "./sales";
import { TB_users } from "./users";

export const customer_status = pgEnum("customer_status", ["active", "inactive", "blocked"]);

export const TB_customers = commonTable(
  "customers",
  {
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
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
}));

export type CustomerSelect = typeof TB_customers.$inferSelect;
export type CustomerInsert = typeof TB_customers.$inferInsert;
export const CustomerCreateSchema = createInsertSchema(TB_customers);
export const CustomerUpdateSchema = object({
  ...partial(omit(CustomerCreateSchema, ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
