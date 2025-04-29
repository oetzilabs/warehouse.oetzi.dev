import { relations } from "drizzle-orm";
import { text, uuid, varchar } from "drizzle-orm/pg-core";
import { commonTable } from "./entity";
import { TB_users } from "./users";

export const TB_websockets = commonTable(
  "websockets",
  {
    userId: varchar("user_id").references(() => TB_users.id, { onDelete: "cascade" }),
    connectionId: text("connection_id").notNull(),
  },
  "ws"
);

export type WebsocketsSelect = typeof TB_websockets.$inferSelect;
export type WebsocketsInsert = typeof TB_websockets.$inferInsert;

export const websocketsRelation = relations(TB_websockets, ({ one, many }) => ({
  user: one(TB_users, {
    fields: [TB_websockets.userId],
    references: [TB_users.id],
  }),
}));
