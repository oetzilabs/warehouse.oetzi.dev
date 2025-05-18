import { relations } from "drizzle-orm";
import { text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { schema } from "../utils";

export const message_type = schema.enum("message_type", ["draft", "normal"]);

export const TB_messages = commonTable(
  "messages",
  {
    title: text("title").notNull(),
    content: text("content").notNull(),
    sender: text("sender").notNull(),
    recipient: text("recipient").notNull(),
    type: message_type("type").default("normal"),
    sentAt: timestamp("sent_at", {
      withTimezone: true,
      mode: "date",
    }),
    readAt: timestamp("read_at", {
      withTimezone: true,
      mode: "date",
    }),
    archivedAt: timestamp("archived_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  "message",
);

export const messages_relations = relations(TB_messages, ({ one }) => ({}));

export type MessageSelect = typeof TB_messages.$inferSelect;
export type MessageInsert = typeof TB_messages.$inferInsert;
export const MessageCreateSchema = object({
  ...createInsertSchema(TB_messages).entries,
});
export const MessageUpdateSchema = object({
  ...partial(MessageCreateSchema).entries,
  id: prefixed_cuid2,
});
