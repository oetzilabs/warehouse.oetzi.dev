import { relations } from "drizzle-orm";
import { text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { commonTable } from "../entity";
import { TB_products } from "../products/products";
import { schema } from "../utils";

export const brand_status = schema.enum("brand_status", ["active", "inactive"]);

export const TB_brands = commonTable(
  "brands",
  {
    name: text("name").notNull(),
    code: text("code").notNull(),
    description: text("description"),
    website: text("website"),
    status: brand_status("status").default("active").notNull(),
    logo_url: text("logo_url"),
  },
  "brd",
);

export const brand_relations = relations(TB_brands, ({ many }) => ({
  products: many(TB_products),
}));

export type BrandSelect = typeof TB_brands.$inferSelect;
export type BrandInsert = typeof TB_brands.$inferInsert;
export const BrandCreateSchema = omit(createInsertSchema(TB_brands), ["createdAt", "updatedAt", "deletedAt", "id"]);
export const BrandUpdateSchema = object({
  ...partial(BrandCreateSchema).entries,
  id: prefixed_cuid2,
});
