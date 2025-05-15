import { relations } from "drizzle-orm";
import { boolean, decimal, integer, json, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-valibot";
import { object, omit, partial } from "valibot";
import { prefixed_cuid2 } from "../../../utils/custom-cuid2-valibot";
import { commonTable } from "./entity";
import { TB_sale_items } from "./sales/sales_items";
import { schema } from "./utils";

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
    category: text("category"),
    brand: text("brand"),
    model: text("model"),

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
    isHazardous: boolean("is_hazardous").default(false),
    requiresRefrigeration: boolean("requires_refrigeration").default(false),

    // Pricing & Costs
    purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }),
    sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
    msrp: decimal("msrp", { precision: 10, scale: 2 }),
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
    certifications: json("certifications").$type<string[]>(),
    safetyStock: integer("safety_stock"),
    customsTariffNumber: text("customs_tariff_number"),
    countryOfOrigin: text("country_of_origin"),

    // Supplier Information
    supplierId: text("supplier_id"),
    manufacturerId: text("manufacturer_id"),

    // Storage Requirements
    storageRequirements: json("storage_requirements").$type<{
      temperature?: { min: number; max: number; unit: "C" | "F" };
      humidity?: { min: number; max: number; unit: "%" };
      specialHandling?: string[];
    }>(),

    // Additional Tracking
    lastReceivedAt: timestamp("last_received_at", { withTimezone: true }),
    lastCountedAt: timestamp("last_counted_at", { withTimezone: true }),
    lastQualityCheckAt: timestamp("last_quality_check_at", { withTimezone: true }),
  },
  "prod",
);

export const product_relations = relations(TB_products, ({ many }) => ({
  saleItems: many(TB_sale_items),
}));

export type ProductSelect = typeof TB_products.$inferSelect;
export type ProductInsert = typeof TB_products.$inferInsert;
export const ProductCreateSchema = createInsertSchema(TB_products);
export const ProductUpdateSchema = object({
  ...partial(omit(ProductCreateSchema, ["createdAt", "updatedAt"])).entries,
  id: prefixed_cuid2,
});
