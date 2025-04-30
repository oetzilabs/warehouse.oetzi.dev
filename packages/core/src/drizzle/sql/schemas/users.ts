import { relations } from "drizzle-orm";
import { pgEnum, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { commonTable } from "./entity";
import { TB_organization_users } from "./organization_users";
import { TB_organizations } from "./organizations";
import { TB_sessions } from "./sessions";
import { schema } from "./utils";
import { TB_warehouses } from "./warehouses";

export const user_status = pgEnum("user_status", ["active", "disabled", "suspended"]);

export const TB_users = commonTable(
  "users",
  {
    name: text("name").notNull(),
    email: text("email").notNull(),
    image: text("image"),
    phone: text("phone"),
    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      mode: "date",
    }),
    currentOrganizationId: varchar("current_organization_id"),
    currentWarehouseId: varchar("current_warehouse_id"),
    status: user_status("status").default("active"),
  },
  "user",
);

export const user_relation = relations(TB_users, ({ one, many }) => ({
  sessions: many(TB_sessions),
  organizations: many(TB_organization_users),
  currentOrganization: one(TB_organizations, {
    fields: [TB_users.currentOrganizationId],
    references: [TB_organizations.id],
  }),
  currentWarehouse: one(TB_warehouses, {
    fields: [TB_users.currentWarehouseId],
    references: [TB_warehouses.id],
  }),
}));

export type UserSelect = typeof TB_users.$inferSelect;
export type UserInsert = typeof TB_users.$inferInsert;
export const UserCreateSchema = omit(createInsertSchema(TB_users), ["createdAt", "updatedAt"]);
export const UserUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_users), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
