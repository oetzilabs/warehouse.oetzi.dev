import { relations } from "drizzle-orm";
import { index, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_organizations_notifications } from "../organizations/organization_notifications";

export const TB_notifications = commonTable(
  "notifications",
  {
    title: text("title").notNull(),
    content: text("content").notNull(),
  },
  "nt",
  (table) => [index("idx_notifications_title").on(table.title)],
);

export const notifications_relations = relations(TB_notifications, ({ many }) => ({
  organizations: many(TB_organizations_notifications),
}));

export type NotificationSelect = typeof TB_notifications.$inferSelect;
export type NotificationInsert = typeof TB_notifications.$inferInsert;
export const NotificationCreateSchema = omit(createInsertSchema(TB_notifications), ["createdAt", "updatedAt"]);
export type NotificationCreate = InferInput<typeof NotificationCreateSchema>;
export const NotificationUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_notifications), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
export type NotificationUpdate = InferInput<typeof NotificationUpdateSchema>;
