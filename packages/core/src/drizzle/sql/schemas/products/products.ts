import { relations } from "drizzle-orm";
import { boolean, decimal, integer, json, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { InferInput, object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../../utils/custom-cuid2-valibot";
import { TB_order_products, TB_supplier_products } from "../../schema";
import { TB_brands } from "../brands/brands";
import { commonTable } from "../entity";
import { TB_sale_items } from "../sales/sales_items";
import { TB_suppliers } from "../suppliers/suppliers";
import { schema } from "../utils";
import { TB_warehouse_products } from "../warehouses/warehouse_products";
import { TB_products_to_labels } from "./product_labels";
import { TB_products_to_certifications } from "./products_certificates";

export const product_status = schema.enum("product_status", [
  "active",
  "discontinued",
  "out_of_stock",
  "recalled",
  "pending_review",
]);

export const product_condition = schema.enum("product_condition", ["new", "used", "refurbished", "damaged", "expired"]);

export const TB_products = commonTable(
  "products",
  {
    // Basic Information
    name: text("name").notNull(),
    description: text("description"),
    sku: text("sku").notNull(),
    barcode: text("barcode"),
    brand_id: text("brand_id").references(() => TB_brands.id),

    // Inventory Control
    minimumStock: integer("minimum_stock").notNull().default(0),
    maximumStock: integer("maximum_stock"),
    reorderPoint: integer("reorder_point"),

    // Quality Control & Tracking
    /* Serial number of the product: e.g., "SN123456789" */
    serialNumber: text("serial_number"),
    /* Lot number of the product: e.g., "LOT2023A". Groups products manufactured under the same condition or batch. */
    lotNumber: text("lot_number"),
    /* Batch number of the product: e.g., "BATCH-2023-001" */
    batchNumber: text("batch_number"),
    /* Date when the product was manufactured */
    manufacturingDate: timestamp("manufacturing_date", { withTimezone: true }),
    /* Date when the product is expected to expire */
    expirationDate: timestamp("expiration_date", { withTimezone: true }),
    /* Number of days until the product is considered "expired" */
    shelfLife: integer("shelf_life_days"),

    // Status & Condition
    status: product_status("status").default("active").notNull(),
    condition: product_condition("condition").default("new").notNull(),

    // Pricing & Costs
    purchasePrice: decimal("purchase_price", { precision: 10, scale: 2, mode: "number" }),
    sellingPrice: decimal("selling_price", { precision: 10, scale: 2, mode: "number" }).notNull(),
    msrp: decimal("msrp", { precision: 10, scale: 2, mode: "number" }),
    currency: text("currency").default("USD"),

    // Physical Attributes
    weight: json("weight").$type<{
      value: number;
      unit: "kg" | "lb";
    }>(),
    dimensions: json("dimensions").$type<{
      length: number;
      width: number;
      height: number;
      unit: "cm" | "in";
    }>(),

    // Regulatory & Compliance
    safetyStock: integer("safety_stock"),
    customsTariffNumber: text("customs_tariff_number"),
    countryOfOrigin: text("country_of_origin"),
  },
  "prod",
);

export const product_relations = relations(TB_products, ({ many, one }) => ({
  saleItems: many(TB_sale_items),
  orders: many(TB_order_products),
  warehouses: many(TB_warehouse_products),
  labels: many(TB_products_to_labels),
  suppliers: many(TB_supplier_products),
  brands: one(TB_brands, {
    fields: [TB_products.brand_id],
    references: [TB_brands.id],
  }),
  certs: many(TB_products_to_certifications),
}));

export type ProductSelect = typeof TB_products.$inferSelect;
export type ProductInsert = typeof TB_products.$inferInsert;
export const ProductCreateSchema = omit(createInsertSchema(TB_products), ["createdAt", "updatedAt", "deletedAt", "id"]);
export const ProductUpdateSchema = object({
  ...partial(ProductCreateSchema).entries,
  id: prefixed_cuid2,
});
export type ProductCreate = InferInput<typeof ProductCreateSchema>;
export type ProductUpdate = InferInput<typeof ProductUpdateSchema>;
