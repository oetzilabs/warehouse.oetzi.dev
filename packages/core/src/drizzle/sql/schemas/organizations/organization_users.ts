import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_users } from "../users/users";
import { schema } from "../utils";
import { TB_organizations } from "./organizations";

export const TB_organization_users = schema.table(
  "org_users",
  (t) => ({
    organization_id: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    user_id: t
      .varchar("user_id")
      .references(() => TB_users.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: t.timestamp("joined_at", { mode: "date", withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    primaryKey({
      columns: [table.user_id, table.organization_id],
    }),
  ],
);

export const organization_users_relation = relations(TB_organization_users, ({ many, one }) => ({
  org: one(TB_organizations, {
    fields: [TB_organization_users.organization_id],
    references: [TB_organizations.id],
  }),
  user: one(TB_users, {
    fields: [TB_organization_users.user_id],
    references: [TB_users.id],
  }),
}));

export type OrganizationUserSelect = typeof TB_organization_users.$inferSelect;
export type OrganizationUserInsert = typeof TB_organization_users.$inferInsert;

export const OrganizationUserCreateSchema = createInsertSchema(TB_organization_users);

export const OrganizationUserUpdateSchema = object({
  ...partial(OrganizationUserCreateSchema).entries,
  id: prefixed_cuid2,
});
