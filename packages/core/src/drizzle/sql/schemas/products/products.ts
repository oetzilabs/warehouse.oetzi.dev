import dayjs from "dayjs";
import { relations } from "drizzle-orm";
import { decimal, integer, json, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { date, InferInput, nullable, object, omit, optional, partial, pipe, string, transform } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import {
  TB_product_to_images,
  TB_storage_to_products,
  TB_supplier_products,
  TB_supplier_purchase_products,
} from "../../schema";
import { TB_brands } from "../brands/brands";
import { TB_catalog_products } from "../catalogs/catalog_products";
import { TB_customer_order_products } from "../customers/customer_order_products";
import { commonTable } from "../entity";
import { TB_organizations_products } from "../organizations/organizations_products";
import { TB_sale_items } from "../sales/sales_items";
import { TB_tax_groups } from "../taxes/tax_group";
import { schema } from "../utils";
import { TB_warehouse_products } from "../warehouses/warehouse_products";
import { TB_products_to_labels } from "./product_labels";
import { TB_products_to_certifications } from "./products_certificates";
import { TB_products_to_storage_conditions } from "./products_to_storage_conditions";

export const TB_products = commonTable(
  "products",
  {
    // Basic Information
    name: text("name").notNull(),
    description: text("description"),
    sku: text("sku").notNull(),
    barcode: text("barcode").unique().notNull(),
    brand_id: text("brand_id").references(() => TB_brands.id),

    // Physical Attributes
    weight: json("weight").$type<{
      value: number;
      unit: "kg" | "lb";
    }>(),
    dimensions: json("dimensions").$type<{
      depth: number;
      width: number;
      height: number;
      unit: "cm" | "in" | (string & {});
    }>(),

    // Regulatory & Compliance
    customsTariffNumber: text("customs_tariff_number"),
    countryOfOrigin: text("country_of_origin"),
  },
  "prod",
);

export const product_relations = relations(TB_products, ({ many, one }) => ({
  saleItems: many(TB_sale_items),
  orders: many(TB_customer_order_products),
  purchases: many(TB_supplier_purchase_products),
  warehouses: many(TB_warehouse_products),
  organizations: many(TB_organizations_products),
  labels: many(TB_products_to_labels),
  suppliers: many(TB_supplier_products),
  brands: one(TB_brands, {
    fields: [TB_products.brand_id],
    references: [TB_brands.id],
  }),
  certs: many(TB_products_to_certifications),
  stco: many(TB_products_to_storage_conditions),
  catalogs: many(TB_catalog_products),
  space: many(TB_storage_to_products),
  images: many(TB_product_to_images),
  stcs: many(TB_products_to_storage_conditions),
}));

export type ProductSelect = typeof TB_products.$inferSelect;
export type ProductInsert = typeof TB_products.$inferInsert;
export const ProductCreateSchema = omit(createInsertSchema(TB_products), ["createdAt", "updatedAt", "deletedAt", "id"]);

export const ProductUpdateSchema = object({
  ...partial(ProductCreateSchema).entries,
  id: prefixed_cuid2,
  deletedAt: optional(nullable(date())),
});

export type ProductCreate = InferInput<typeof ProductCreateSchema>;
export type ProductUpdate = InferInput<typeof ProductUpdateSchema>;
