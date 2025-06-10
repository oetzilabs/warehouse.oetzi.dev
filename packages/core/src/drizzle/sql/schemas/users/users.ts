import { relations } from "drizzle-orm";
import { boolean, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial, string } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_catalogs } from "../catalogs/catalogs";
import { TB_customer_orders } from "../customers/customer_orders";
import { commonTable } from "../entity";
import { TB_messages } from "../messages/messages";
import { TB_organization_users } from "../organizations/organization_users";
import { TB_payment_history } from "../payments/payment_history";
import { TB_sessions } from "../sessions";
import { schema } from "../utils";
import { TB_user_payment_methods } from "./user_payment_methods";
import { TB_users_warehouses } from "./users_warehouses";

export const user_status = schema.enum("user_status", ["active", "disabled", "suspended"]);

export const TB_users = commonTable(
  "users",
  {
    email: text("email").notNull(),
    hashed_password: text("hashed_password").notNull(),
    name: text("name").notNull(),
    image: text("image"),
    phone: text("phone"),
    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      mode: "date",
    }),
    status: user_status("status").default("active"),
    has_finished_onboarding: boolean("has_finished_onboarding").notNull().default(false),
  },
  "user",
);

export const user_relation = relations(TB_users, ({ one, many }) => ({
  sessions: many(TB_sessions),
  orgs: many(TB_organization_users),
  whs: many(TB_users_warehouses),
  payment_methods: many(TB_user_payment_methods),
  payment_history: many(TB_payment_history),
  customerOrders: many(TB_customer_orders),
  catalogs: many(TB_catalogs),
}));

export type UserSelect = typeof TB_users.$inferSelect;
export type UserInsert = typeof TB_users.$inferInsert;
export const UserCreateSchema = object({
  ...omit(createInsertSchema(TB_users), ["createdAt", "updatedAt", "hashed_password"]).entries,
  password: string(),
});
export const UserUpdateSchema = object({
  ...partial(UserCreateSchema).entries,
  id: prefixed_cuid2,
});
