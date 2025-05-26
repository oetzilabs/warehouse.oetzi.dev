import { relations } from "drizzle-orm";
import { text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_customers } from "./customers";

export const TB_customer_notes = commonTable(
  "customer_notes",
  {
    customerId: text("customer_id")
      .notNull()
      .references(() => TB_customers.id),
    title: text("title").notNull(),
    content: text("content").notNull(),
  },
  "custnote",
);

export const customer_notes_relations = relations(TB_customer_notes, ({ one }) => ({
  customer: one(TB_customers, {
    fields: [TB_customer_notes.customerId],
    references: [TB_customers.id],
  }),
}));

export type CustomerNoteSelect = typeof TB_customer_notes.$inferSelect;
export type CustomerNoteInsert = typeof TB_customer_notes.$inferInsert;

export const CustomerNoteCreateSchema = omit(createInsertSchema(TB_customer_notes), [
  "createdAt",
  "updatedAt",
  "deletedAt",
  "id",
]);

export const CustomerNoteUpdateSchema = object({
  ...partial(CustomerNoteCreateSchema).entries,
  id: prefixed_cuid2,
});

export type CustomerNoteCreate = InferInput<typeof CustomerNoteCreateSchema>;
export type CustomerNoteUpdate = InferInput<typeof CustomerNoteUpdateSchema>;
