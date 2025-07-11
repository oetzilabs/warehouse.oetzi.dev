import { ANYONE_CAN, definePermissions, PermissionsConfig, UpdateValue, type Row } from "@rocicorp/zero";
import { AuthVerified } from "@warehouseoetzidev/core/src/entities/authentication";
import { schema, type Schema } from "./schema.gen";

export type User = Row<typeof schema.tables.TB_users>;
export type Session = Row<typeof schema.tables.TB_sessions>;
export type Organization = Row<typeof schema.tables.TB_organizations>;
export type Catalog = Row<typeof schema.tables.TB_catalogs>;
export type Customer = Row<typeof schema.tables.TB_customers>;
export type CustomerOrder = Row<typeof schema.tables.TB_customer_orders>;
export type Device = Row<typeof schema.tables.TB_devices>;
export type Message = Row<typeof schema.tables.TB_messages>;
export type OrganizationUser = Row<typeof schema.tables.TB_organization_users>;
export type OrganizationWarehouse = Row<typeof schema.tables.TB_organizations_warehouses>;
export type OrganizationDiscount = Row<typeof schema.tables.TB_organization_discounts>;
export type OrganizationSupplier = Row<typeof schema.tables.TB_organization_suppliers>;
export type OrganizationCustomer = Row<typeof schema.tables.TB_organization_customers>;
export type OrganizationProduct = Row<typeof schema.tables.TB_organizations_products>;
export type OrganizationSale = Row<typeof schema.tables.TB_organizations_sales>;
export type Product = Row<typeof schema.tables.TB_products>;
export type Sale = Row<typeof schema.tables.TB_sales>;
export type SaleItem = Row<typeof schema.tables.TB_sale_items>;
export type SaleDiscount = Row<typeof schema.tables.TB_sales_discounts>;
export type Schedule = Row<typeof schema.tables.TB_schedules>;
export type Supplier = Row<typeof schema.tables.TB_suppliers>;
export type SupplierPurchase = Row<typeof schema.tables.TB_supplier_purchases>;
export type SupplierSchedule = Row<typeof schema.tables.TB_supplier_schedules>;
export type UserOrder = Row<typeof schema.tables.TB_user_orders>;
export type UserPaymentMethod = Row<typeof schema.tables.TB_user_payment_methods>;
export type UserWarehouse = Row<typeof schema.tables.TB_users_warehouses>;

export const permissions = definePermissions<AuthVerified, Schema>(schema, () => {
  return {
    // medium: {
    //   row: {
    //     select: ANYONE_CAN,
    //   },
    // },
    // user: {
    //   row: {
    //     select: ANYONE_CAN,
    //   },
    // },
    // message: {
    //   row: {
    //     select: ANYONE_CAN,
    //   },
    // },
  } satisfies PermissionsConfig<AuthVerified, Schema>;
});

export { schema, Schema };
