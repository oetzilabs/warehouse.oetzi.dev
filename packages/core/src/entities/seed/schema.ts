import { array, boolean, date, literal, nullable, number, object, omit, string, union } from "valibot";
import {
  CustomerCreateSchema,
  FacilityCreateSchema,
  OrganizationCustomerOrderCreateSchema,
  OrganizationSupplierOrderCreateSchema,
  SupplierCreateSchema,
  WarehouseAreaCreateSchema,
  WarehouseTypeCreateSchema,
} from "../../drizzle/sql/schema";
import { BrandCreateSchema } from "../../drizzle/sql/schemas/brands/brands";
import { DeviceCreateSchema } from "../../drizzle/sql/schemas/devices/devices";
import { DocumentStorageOfferCreateSchema } from "../../drizzle/sql/schemas/documents/storage_offers";
import { OrganizationCreateSchema } from "../../drizzle/sql/schemas/organizations/organizations";
import { PaymentMethodCreateSchema } from "../../drizzle/sql/schemas/payments/payment_methods";
import { ProductLabelCreateSchema } from "../../drizzle/sql/schemas/products/product_labels";
import { ProductCreateWithDateTransformSchema } from "../../drizzle/sql/schemas/products/products";
import { SaleCreateSchema } from "../../drizzle/sql/schemas/sales/sales";
import { SaleItemCreateSchema } from "../../drizzle/sql/schemas/sales/sales_items";
import { StorageInventoryCreateSchema } from "../../drizzle/sql/schemas/storages/storage_space";
import { StorageTypeCreateSchema } from "../../drizzle/sql/schemas/storages/storage_types";
import { StorageCreateSchema } from "../../drizzle/sql/schemas/storages/storages";
import { UserCreateSchema } from "../../drizzle/sql/schemas/users/users";
import { WarehouseCreateSchema } from "../../drizzle/sql/schemas/warehouses/warehouses";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";

export const DimensionsSchema = object({
  width: number(),
  height: number(),
  length: number(),
});

export const BoundingBoxSchema = object({
  x: number(),
  y: number(),
  width: number(),
  height: number(),
});

export const StorageBoundingBoxSchema = object({
  x: number(),
  y: number(),
  width: number(),
  length: number(),
  height: number(),
});

export const WeightSchema = object({
  value: number(),
  unit: string(),
});

export const StorageSpaceSchema = object({
  ...omit(StorageInventoryCreateSchema, ["storageId"]).entries,
  id: prefixed_cuid2,
});

export const StorageSchema = object({
  ...omit(StorageCreateSchema, ["warehouseAreaId"]).entries,
  id: prefixed_cuid2,
  spaces: array(StorageSpaceSchema),
});

export const WarehouseAreaSchema = object({
  ...omit(WarehouseAreaCreateSchema, ["warehouse_facility_id"]).entries,
  id: prefixed_cuid2,
  storages: array(StorageSchema),
});

export const FacilitySchema = object({
  ...omit(FacilityCreateSchema, ["warehouse_id", "ownerId"]).entries,
  id: prefixed_cuid2,
  areas: array(WarehouseAreaSchema),
});

export const ProductLabelSchema = object({
  ...ProductLabelCreateSchema.entries,
  id: prefixed_cuid2,
});

export const ProductSchema = object({
  ...ProductCreateWithDateTransformSchema.entries,
  id: prefixed_cuid2,
  labels: array(string()), // references to label IDs
});

export const WarehouseSchema = object({
  ...WarehouseCreateSchema.entries,
  id: prefixed_cuid2,
  facilities: array(FacilitySchema),
  products: array(string()), // references to product IDs
});

export const CustomerOrderSchema = object({
  ...OrganizationCustomerOrderCreateSchema.entries,
});

export const SupplierOrderSchema = object({
  ...OrganizationSupplierOrderCreateSchema.entries,
});

export const OrderSchema = object({
  customers: array(CustomerOrderSchema),
  suppliers: array(SupplierOrderSchema),
});

export const OrganizationSchema = object({
  ...OrganizationCreateSchema.entries,
  id: prefixed_cuid2,
  slug: string(),
  warehouses: array(WarehouseSchema),
  products: array(string()), // references to product IDs
  suppliers: array(string()), // references to supplier IDs
  customers: array(string()), // references to customer IDs
  orders: OrderSchema,
});

export const UserSchema = object({
  ...omit(UserCreateSchema, ["password"]).entries,
  id: prefixed_cuid2,
  hashed_password: string(),
  organizations: array(OrganizationSchema),
});

export const PaymentMethodSchema = object({
  ...PaymentMethodCreateSchema.entries,
  id: prefixed_cuid2,
});

export const DocumentStorageOfferSchema = object({
  ...DocumentStorageOfferCreateSchema.entries,
  id: prefixed_cuid2,
});

export const WarehouseTypeSchema = object({
  ...WarehouseTypeCreateSchema.entries,
  id: prefixed_cuid2,
});

export const StorageTypeSchema = object({
  ...StorageTypeCreateSchema.entries,
  id: prefixed_cuid2,
});

export const BrandSchema = object({
  ...BrandCreateSchema.entries,
  id: prefixed_cuid2,
});

export const SupplierSchema = object({
  ...SupplierCreateSchema.entries,
  id: prefixed_cuid2,
  products: array(string()), // references to product IDs
});

export const SalesItemSchema = object({
  ...SaleItemCreateSchema.entries,
});

export const SaleSchema = object({
  ...SaleCreateSchema.entries,
  id: prefixed_cuid2,
  items: array(SalesItemSchema), // references to product IDs
});

export const CustomerSchema = object({
  ...CustomerCreateSchema.entries,
  id: prefixed_cuid2,
  sales: array(string()), // references to sales IDs
});

export const SeedDataSchema = object({
  users: array(UserSchema),
  products: array(ProductSchema),
  labels: array(ProductLabelSchema),
  payment_methods: array(PaymentMethodSchema),
  warehouse_types: array(WarehouseTypeSchema),
  document_storage_offers: array(DocumentStorageOfferSchema),
  storage_types: array(StorageTypeSchema),
  brands: array(BrandSchema),
  suppliers: array(SupplierSchema),
  customers: array(CustomerSchema),
  sales: array(SaleSchema),
});
