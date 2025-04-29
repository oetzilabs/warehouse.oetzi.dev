import { relations } from "drizzle-orm";
import { text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { commonTable } from "./entity";
import { TB_organization_users } from "./organization_users";
import { TB_sessions } from "./sessions";
import { schema } from "./utils";

export const entity_type = schema.enum("user_types", ["mail_bot", "app", "user", "admin"]);

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
    type: entity_type("type").notNull(),
  },
  "user",
);

export const user_relation = relations(TB_users, ({ many }) => ({
  sessions: many(TB_sessions),
  organizations: many(TB_organization_users),
}));

export type UserSelect = typeof TB_users.$inferSelect;
export type UserInsert = typeof TB_users.$inferInsert;
export const UserCreateSchema = omit(createInsertSchema(TB_users), ["createdAt", "updatedAt"]);
export const UserUpdateSchema = object({
  ...partial(omit(createInsertSchema(TB_users), ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
