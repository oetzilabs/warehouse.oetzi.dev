import { relations } from "drizzle-orm";
import { primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_notifications } from "../notifications/notifications";
import { TB_users } from "../users/users";
import { schema } from "../utils";
import { TB_organizations } from "./organizations";

export const TB_organizations_notifications = schema.table(
  "organizations_notifications",
  (t) => ({
    organizationId: t
      .varchar("organization_id")
      .references(() => TB_organizations.id, { onDelete: "cascade" })
      .notNull(),
    notificationId: t
      .varchar("notification_id")
      .references(() => TB_notifications.id, { onDelete: "cascade" })
      .notNull(),
    readAt: t.timestamp("read_at", { mode: "date" }),
    readByUserId: t.varchar("read_by").references(() => TB_users.id),
  }),
  (table) => [primaryKey({ columns: [table.organizationId, table.notificationId] })],
);

export const organizations_notifications_relations = relations(TB_organizations_notifications, ({ one }) => ({
  organization: one(TB_organizations, {
    fields: [TB_organizations_notifications.organizationId],
    references: [TB_organizations.id],
  }),
  notification: one(TB_notifications, {
    fields: [TB_organizations_notifications.notificationId],
    references: [TB_notifications.id],
  }),
  readBy: one(TB_users, {
    fields: [TB_organizations_notifications.readByUserId],
    references: [TB_users.id],
  }),
}));

export type OrganizationNotificationSelect = typeof TB_organizations_notifications.$inferSelect;
export type OrganizationNotificationInsert = typeof TB_organizations_notifications.$inferInsert;
export const OrganizationNotificationCreateSchema = createInsertSchema(TB_organizations_notifications);
export const OrganizationNotificationUpdateSchema = object({
  ...partial(OrganizationNotificationCreateSchema).entries,
  id: prefixed_cuid2,
});
