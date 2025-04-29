import { relations } from "drizzle-orm";
import { text, timestamp, varchar } from "drizzle-orm/pg-core";
import { TB_organizations } from "./organizations";
import { TB_users } from "./users";
import { schema } from "./utils";

export const TB_sessions = schema.table("session", {
  id: text("id").primaryKey(),
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
  access_token: text("access_token"),
  current_organization_id: varchar("current_organization_id"),
});

export const session_relation = relations(TB_sessions, ({ one, many }) => ({
  user: one(TB_users, {
    fields: [TB_sessions.userId],
    references: [TB_users.id],
  }),
  organizations: many(TB_organizations),
}));

export type SessionSelect = typeof TB_sessions.$inferSelect;
export type SessionInsert = typeof TB_sessions.$inferInsert;
