import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { TB_organizations } from "./organizations";
import { TB_users } from "./users";
import { schema } from "./utils";
import { TB_warehouses } from "./warehouses";

export const TB_sessions = schema.table("session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => `session_${createId()}`),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  }),
  userId: varchar("user_id")
    .notNull()
    .references(() => TB_users.id, {
      onDelete: "cascade",
      onUpdate: "no action",
    }),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  access_token: text("access_token").notNull(),
  current_organization_id: varchar("current_organization_id").references(() => TB_organizations.id, {
    onDelete: "cascade",
  }),
  current_warehouse_id: varchar("current_warehouse_id").references(() => TB_warehouses.id, {
    onDelete: "cascade",
  }),
});

export const session_relation = relations(TB_sessions, ({ one, many }) => ({
  user: one(TB_users, {
    fields: [TB_sessions.userId],
    references: [TB_users.id],
  }),
  org: one(TB_organizations, {
    fields: [TB_sessions.current_organization_id],
    references: [TB_organizations.id],
  }),
  wh: one(TB_warehouses, {
    fields: [TB_sessions.current_warehouse_id],
    references: [TB_warehouses.id],
  }),
}));

export type SessionSelect = typeof TB_sessions.$inferSelect;
export type SessionInsert = typeof TB_sessions.$inferInsert;

export const SessionCreateSchema = omit(createInsertSchema(TB_sessions), ["id", "createdAt", "updatedAt"]);
export const SessionUpdateSchema = object({
  ...partial(SessionCreateSchema).entries,
  id: prefixed_cuid2,
});
