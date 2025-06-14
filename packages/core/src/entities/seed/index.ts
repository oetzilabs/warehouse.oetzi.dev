import { toJsonSchema } from "@valibot/to-json-schema";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { Console, Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import data from "../../data/seed.json";
import {
  TB_brands,
  TB_customer_order_products,
  TB_customer_orders,
  TB_customers,
  TB_device_types,
  TB_devices,
  TB_document_storage_offers,
  TB_notifications,
  TB_organization_customers,
  TB_organization_product_price_history,
  TB_organization_suppliers,
  TB_organization_users,
  TB_organizations,
  TB_organizations_notifications,
  TB_organizations_products,
  TB_organizations_sales,
  TB_organizations_warehouses,
  TB_payment_methods,
  TB_product_labels,
  TB_products,
  TB_products_to_labels,
  TB_sale_items,
  TB_sales,
  TB_storage_to_labels,
  TB_storage_to_products,
  TB_storage_types,
  TB_storages,
  TB_supplier_product_price_history,
  TB_supplier_products,
  TB_supplier_purchase_products,
  TB_supplier_purchases,
  TB_suppliers,
  TB_tax_group_countryrates,
  TB_tax_groups,
  TB_tax_rates,
  TB_users,
  TB_users_warehouses,
  TB_warehouse_areas,
  TB_warehouse_facilities,
  TB_warehouse_products,
  TB_warehouse_types,
  TB_warehouses,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { StorageInvalidId, StorageNotCreated, StorageNotFound, StorageNotUpdated } from "../storages/errors";
import { SeedingFailed } from "./errors";
import { SeedDataSchema, StorageSchema } from "./schema";

export class SeedService extends Effect.Service<SeedService>()("@warehouse/seed", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const createStorage = (storage: InferInput<typeof StorageSchema>, areaId: string | null) =>
      Effect.gen(function* (_) {
        const { children, labels, products, ...storageData } = storage;
        const [created] = yield* Effect.promise(() =>
          db
            .insert(TB_storages)
            .values({ ...storageData, warehouseAreaId: areaId })
            .onConflictDoUpdate({
              target: TB_storages.id,
              set: { ...storageData, warehouseAreaId: areaId },
            })
            .returning(),
        );
        return created;
      });

    const seedStorage = (
      storage: InferInput<typeof StorageSchema>,
      areaId: string | null,
    ): Effect.Effect<Effect.Effect.Success<ReturnType<typeof createStorage>>, StorageNotCreated> =>
      Effect.gen(function* (_) {
        // Insert storage
        const created = yield* createStorage(storage, areaId);
        if (!created) {
          return yield* Effect.fail(new StorageNotCreated());
        }
        yield* Console.log(`storage ${storage.id} added to area ${areaId}`);

        const labels = storage.labels ?? [];
        // Add labels
        for (const labelId of labels) {
          yield* Effect.promise(() =>
            db
              .insert(TB_storage_to_labels)
              .values({ labelId, storageId: created.id })
              .onConflictDoUpdate({
                target: [TB_storage_to_labels.labelId, TB_storage_to_labels.storageId],
                set: { labelId, storageId: created.id },
              })
              .returning(),
          );
        }

        const products = storage.products ?? [];
        // Add products
        for (const product of products) {
          yield* Effect.promise(() =>
            db
              .insert(TB_storage_to_products)
              .values({
                productId: product.product_id,
                id: product.id,
                storageId: created.id,
              })
              .onConflictDoUpdate({
                target: [TB_storage_to_products.id, TB_storage_to_products.productId, TB_storage_to_products.storageId],
                set: {
                  productId: product.product_id,
                  id: product.id,
                  storageId: created.id,
                },
              })
              .returning(),
          );
        }

        // Recursively handle children
        if (storage.children.length > 0) {
          for (const child of storage.children) {
            yield* Effect.suspend(() => seedStorage({ ...child, parentId: created.id }, null));
          }
        }
        return created;
      });

    const seed = () =>
      Effect.gen(function* (_) {
        const seedData = safeParse(SeedDataSchema, data);
        if (!seedData.success) {
          return yield* Effect.fail(
            new SeedingFailed({
              message: seedData.issues.map((i) => `[${i.path?.map((x) => x.key).join(".")}] ${i.message}`).join(", "),
              service: "parsing",
            }),
          );
        }

        // Add device types seeding before other resources
        for (const deviceType of seedData.output.device_types) {
          yield* Effect.promise(() =>
            db
              .insert(TB_device_types)
              .values(deviceType)
              .onConflictDoUpdate({
                target: TB_device_types.id,
                set: deviceType,
              })
              .returning(),
          );
        }
        yield* Console.log("device_types added");

        for (const taxRate of seedData.output.tax_rates) {
          yield* Effect.promise(() =>
            db
              .insert(TB_tax_rates)
              .values(taxRate)
              .onConflictDoUpdate({
                target: TB_tax_rates.id,
                set: taxRate,
              })
              .returning(),
          );
        }
        yield* Console.log("tax_rates added");

        for (const taxGroup of seedData.output.tax_groups) {
          yield* Effect.promise(() =>
            db
              .insert(TB_tax_groups)
              .values(taxGroup)
              .onConflictDoUpdate({
                target: TB_tax_groups.id,
                set: taxGroup,
              })
              .returning(),
          );
        }
        yield* Console.log("tax_groups added");

        for (const taxGroupCountryRate of seedData.output.tax_group_countryrates) {
          yield* Effect.promise(() =>
            db
              .insert(TB_tax_group_countryrates)
              .values({
                ...taxGroupCountryRate,
                effective_date: dayjs(taxGroupCountryRate.effective_date).toDate(),
                expiration_date: taxGroupCountryRate.expiration_date
                  ? dayjs(taxGroupCountryRate.expiration_date).toDate()
                  : null,
              })
              .onConflictDoUpdate({
                target: [TB_tax_group_countryrates.taxGroupId, TB_tax_group_countryrates.taxRateId],
                set: {
                  ...taxGroupCountryRate,
                  effective_date: dayjs(taxGroupCountryRate.effective_date).toDate(),
                  expiration_date: taxGroupCountryRate.expiration_date
                    ? dayjs(taxGroupCountryRate.expiration_date).toDate()
                    : null,
                },
              })
              .returning(),
          );
        }
        yield* Console.log("tax_group_countryrates added");

        for (const storageType of seedData.output.storage_types) {
          yield* Effect.promise(() =>
            db
              .insert(TB_storage_types)
              .values(storageType)
              .onConflictDoUpdate({
                target: TB_storage_types.id,
                set: storageType,
              })
              .returning(),
          );
        }
        yield* Console.log("storage_types added");

        // Seed warehouse types first since warehouses depend on them
        for (const warehouseType of seedData.output.warehouse_types) {
          yield* Effect.promise(() =>
            db
              .insert(TB_warehouse_types)
              .values(warehouseType)
              .onConflictDoUpdate({
                target: TB_warehouse_types.id,
                set: warehouseType,
              })
              .returning(),
          );
        }
        yield* Console.log("warehouse_types added");

        // Seed payment methods first since products depend on them
        for (const paymentMethod of seedData.output.payment_methods) {
          yield* Effect.promise(() =>
            db
              .insert(TB_payment_methods)
              .values(paymentMethod)
              .onConflictDoUpdate({
                target: TB_payment_methods.id,
                set: paymentMethod,
              })
              .returning(),
          );
        }
        yield* Console.log("payment_methods added");

        // Seed labels first since products depend on them
        for (const label of seedData.output.labels) {
          yield* Effect.promise(() =>
            db
              .insert(TB_product_labels)
              .values(label)
              .onConflictDoUpdate({
                target: TB_product_labels.id,
                set: label,
              })
              .returning(),
          );
        }
        yield* Console.log("product_labels added");

        // Seed products
        for (const product of seedData.output.products) {
          const { labels, ...productData } = product;

          yield* Effect.promise(() =>
            db
              .insert(TB_products)
              .values(productData)
              .onConflictDoUpdate({
                target: TB_products.id,
                set: productData,
              })
              .returning(),
          );
          for (const labelId of labels) {
            yield* Effect.promise(() =>
              db
                .insert(TB_products_to_labels)
                .values({ labelId: labelId, productId: productData.id })
                .onConflictDoNothing()
                .returning(),
            );
          }
        }
        yield* Console.log("products added");

        for (const notification of seedData.output.notifications) {
          yield* Effect.promise(() =>
            db
              .insert(TB_notifications)
              .values(notification)
              .onConflictDoUpdate({
                target: TB_notifications.id,
                set: notification,
              })
              .returning(),
          );
        }
        yield* Console.log("notifications added");

        for (const brand of seedData.output.brands) {
          yield* Effect.promise(() =>
            db
              .insert(TB_brands)
              .values(brand)
              .onConflictDoUpdate({
                target: TB_brands.id,
                set: brand,
              })
              .returning(),
          );
        }
        yield* Console.log("brands added");

        for (const supplier of seedData.output.suppliers) {
          yield* Effect.promise(() =>
            db
              .insert(TB_suppliers)
              .values(supplier)
              .onConflictDoUpdate({
                target: TB_suppliers.id,
                set: supplier,
              })
              .returning(),
          );
          for (const productId of supplier.products) {
            yield* Effect.promise(() =>
              db
                .insert(TB_supplier_products)
                .values({ supplierId: supplier.id, productId: productId })
                .onConflictDoNothing()
                .returning(),
            );
          }
        }
        yield* Console.log("suppliers added");

        for (const customer of seedData.output.customers) {
          yield* Effect.promise(() =>
            db
              .insert(TB_customers)
              .values(customer)
              .onConflictDoUpdate({
                target: TB_customers.id,
                set: customer,
              })
              .returning(),
          );
        }
        yield* Console.log("customers added");

        // Seed storage offers
        for (const documentStorageOffer of seedData.output.document_storage_offers) {
          yield* Effect.promise(() =>
            db
              .insert(TB_document_storage_offers)
              .values(documentStorageOffer)
              .onConflictDoUpdate({
                target: TB_document_storage_offers.id,
                set: documentStorageOffer,
              })
              .returning(),
          );
        }
        yield* Console.log("document_storage_offers added");

        // Seed users and their nested data
        for (const user of seedData.output.users) {
          const { organizations, ...userData } = user;

          // Insert user
          yield* Effect.promise(() =>
            db
              .insert(TB_users)
              .values(userData)
              .onConflictDoUpdate({
                target: TB_users.id,
                set: userData,
              })
              .returning(),
          );
          yield* Console.log(`user ${user.id} added`);

          // Process organizations
          for (const org of organizations) {
            const { warehouses, products, ...orgData } = org;

            // Insert organization
            const [orgCreated] = yield* Effect.promise(() =>
              db
                .insert(TB_organizations)
                .values({ ...orgData, owner_id: user.id })
                .onConflictDoUpdate({
                  target: TB_organizations.id,
                  set: orgData,
                })
                .returning(),
            );
            yield* Console.log(`organization ${org.id} added`);
            yield* Effect.promise(() =>
              db
                .insert(TB_organization_users)
                .values({ organization_id: org.id, user_id: user.id })
                .onConflictDoNothing()
                .returning(),
            );
            yield* Console.log(`user ${user.id} added to organization ${org.id}`);

            // Add devices to organization
            for (const device of org.devices) {
              yield* Effect.promise(() =>
                db
                  .insert(TB_devices)
                  .values({ ...device, organization_id: org.id })
                  .onConflictDoNothing()
                  .returning(),
              );
            }
            yield* Console.log(`devices for organization ${org.id} added`);

            // Process warehouses
            for (const warehouse of warehouses) {
              const { facilities, products, ...warehouseData } = warehouse;

              // Insert warehouse
              yield* Effect.promise(() =>
                db
                  .insert(TB_warehouses)
                  .values({ ...warehouseData, ownerId: user.id })
                  .onConflictDoUpdate({
                    target: TB_warehouses.id,
                    set: { ...warehouseData, ownerId: user.id },
                  })
                  .returning(),
              );
              yield* Console.log(`warehouse ${warehouse.id} added`);
              yield* Effect.promise(() =>
                db
                  .insert(TB_users_warehouses)
                  .values({ userId: user.id, warehouseId: warehouse.id })
                  .onConflictDoNothing()
                  .returning(),
              );
              yield* Console.log(`user ${user.id} added to warehouse ${warehouse.id}`);
              yield* Effect.promise(() =>
                db
                  .insert(TB_organizations_warehouses)
                  .values({ organizationId: org.id, warehouseId: warehouse.id })
                  .onConflictDoNothing()
                  .returning(),
              );
              yield* Console.log(`warehouse ${warehouse.id} added to organization ${org.id}`);

              // Process facilities
              for (const facility of facilities) {
                const { areas, ...facilityData } = facility;

                // Insert facility
                yield* Effect.promise(() =>
                  db
                    .insert(TB_warehouse_facilities)
                    .values({ ...facilityData, ownerId: user.id, warehouse_id: warehouse.id })
                    .onConflictDoUpdate({
                      target: TB_warehouse_facilities.id,
                      set: facilityData,
                    })
                    .returning(),
                );
                yield* Console.log(`facility ${facility.id} added to warehouse ${warehouse.id}`);

                // Process areas
                for (const area of areas) {
                  const { storages, ...areaData } = area;

                  // Insert area
                  yield* Effect.promise(() =>
                    db
                      .insert(TB_warehouse_areas)
                      .values({ ...areaData, warehouse_facility_id: facility.id })
                      .onConflictDoUpdate({
                        target: TB_warehouse_areas.id,
                        set: areaData,
                      })
                      .returning(),
                  );
                  yield* Console.log(`area ${area.id} added to facility ${facility.id}`);

                  // Process storages recursively
                  for (const storage of storages) {
                    yield* seedStorage(storage, area.id);
                  }
                }
              }

              for (const productId of products) {
                // TODO: Add product to warehouse
                yield* Effect.promise(() =>
                  db
                    .insert(TB_warehouse_products)
                    .values({ warehouseId: warehouse.id, productId: productId })
                    .onConflictDoNothing()
                    .returning(),
                );
                yield* Console.log(`product ${productId} added to warehouse ${warehouse.id}`);
              }
            }
            yield* Console.log(`warehouses for organization ${org.id} added`);

            for (const product of org.products) {
              const [addedProduct] = yield* Effect.promise(() =>
                db
                  .insert(TB_organizations_products)
                  .values({
                    ...product,
                    organizationId: org.id,
                  })
                  .onConflictDoUpdate({
                    target: [TB_organizations_products.productId, TB_organizations_products.organizationId],
                    set: {
                      ...product,
                      organizationId: org.id,
                    },
                  })
                  .returning(),
              );
              yield* Console.log(`product ${product.productId} added to organization ${org.id}`);

              for (const pricing of product.pricing) {
                yield* Effect.promise(() =>
                  db
                    .insert(TB_organization_product_price_history)
                    .values({
                      ...pricing,
                      organizationId: org.id,
                      productId: product.productId,
                    })
                    .onConflictDoUpdate({
                      target: [
                        TB_organization_product_price_history.organizationId,
                        TB_organization_product_price_history.productId,
                        TB_organization_product_price_history.effectiveDate,
                      ],
                      set: {
                        ...pricing,
                        productId: product.productId,
                        organizationId: org.id,
                      },
                    })
                    .returning(),
                );
                yield* Console.log(`product history for ${product.productId} added for organization ${org.id}`);
              }
              yield* Console.log(`product ${product.productId} added to organization ${org.id}`);
            }
            yield* Console.log(`products for organization ${org.id} added`);

            // Add customer to organization
            for (const customerId of org.customers) {
              yield* Effect.promise(() =>
                db
                  .insert(TB_organization_customers)
                  .values({ organization_id: org.id, customer_id: customerId })
                  .onConflictDoNothing()
                  .returning(),
              );
            }
            yield* Console.log(`customers for organization ${org.id} added`);

            for (const supplierId of org.suppliers) {
              yield* Effect.promise(() =>
                db
                  .insert(TB_organization_suppliers)
                  .values({ organization_id: org.id, supplier_id: supplierId })
                  .onConflictDoNothing()
                  .returning(),
              );
            }
            yield* Console.log(`suppliers for organization ${org.id} added`);

            for (const order of org.orders) {
              const { products, ...orderData } = order;
              const [added] = yield* Effect.promise(() =>
                db
                  .insert(TB_customer_orders)
                  .values({ ...orderData, organization_id: org.id })
                  .onConflictDoUpdate({
                    target: TB_customer_orders.id,
                    set: { ...orderData, organization_id: org.id },
                  })
                  .returning(),
              );
              // if (!added) {
              //   return yield* Effect.fail(
              //     new SeedingFailed({ message: "Failed to add order", service: "org.customer_orders" }),
              //   );
              // }
              yield* Console.log(`order ${orderData.id} added to organization ${org.id}`);

              for (const product of products) {
                const [productAdded] = yield* Effect.promise(() =>
                  db
                    .insert(TB_customer_order_products)
                    .values({ ...product, customerOrderId: orderData.id })
                    .onConflictDoUpdate({
                      target: TB_customer_order_products.id,
                      set: { ...product, customerOrderId: orderData.id },
                    })
                    .returning(),
                );

                // if (!productAdded) {
                //   return yield* Effect.fail(
                //     new SeedingFailed({
                //       message: "Failed to add order product",
                //       service: "org.customer_order_products",
                //     }),
                //   );
                // }
                yield* Console.log(`order ${orderData.id} added to customer ${orderData.customer_id}`);
              }
              yield* Console.log(`orders for organization ${org.id} added`);
            }
            yield* Console.log("orders added");

            // Add sales seeding
            for (const sale of org.sales) {
              const { items, ...saleData } = sale;
              const [saleAdded] = yield* Effect.promise(() =>
                db
                  .insert(TB_sales)
                  .values({
                    ...saleData,
                    createdAt: saleData.createdAt ? dayjs(saleData.createdAt).toDate() : new Date(),
                  })
                  .onConflictDoUpdate({
                    target: TB_sales.id,
                    set: {
                      ...saleData,
                      createdAt: saleData.createdAt ? dayjs(saleData.createdAt).toDate() : new Date(),
                    },
                  })
                  .returning(),
              );

              for (const item of items) {
                yield* Effect.promise(() =>
                  db
                    .insert(TB_sale_items)
                    .values({ ...item, saleId: sale.id })
                    .onConflictDoUpdate({
                      target: [TB_sale_items.productId, TB_sale_items.saleId],
                      set: { ...item, saleId: sale.id },
                    })
                    .returning(),
                );
              }
              yield* Console.log(`sale ${sale.id} added to organization ${org.id}`);
            }
            yield* Console.log("sales added");

            for (const purchase of org.purchases) {
              const { products, ...purchaseData } = purchase;
              const [purchaseAdded] = yield* Effect.promise(() =>
                db
                  .insert(TB_supplier_purchases)
                  .values({
                    ...purchaseData,
                    organization_id: org.id,
                    createdAt: purchaseData.createdAt ? dayjs(purchaseData.createdAt).toDate() : new Date(),
                  })
                  .onConflictDoUpdate({
                    target: TB_supplier_purchases.id,
                    set: {
                      ...purchaseData,
                      organization_id: org.id,
                      createdAt: purchaseData.createdAt ? dayjs(purchaseData.createdAt).toDate() : new Date(),
                    },
                  })
                  .returning(),
              );

              for (const product of products) {
                const [x] = yield* Effect.promise(() =>
                  db
                    .insert(TB_supplier_purchase_products)
                    .values({ ...product, supplierPurchaseId: purchase.id })
                    .onConflictDoUpdate({
                      target: TB_supplier_purchase_products.id,
                      set: { ...product, supplierPurchaseId: purchase.id },
                    })
                    .returning(),
                );

                yield* Console.log(`ADDING PRODUCT HISTORY, list: ${product.pricing.length}`);
                for (const pricing of product.pricing) {
                  const [x] = yield* Effect.promise(() =>
                    db
                      .insert(TB_supplier_product_price_history)
                      .values({
                        ...pricing,
                        supplierId: purchaseData.supplier_id,
                        productId: product.productId,
                      })
                      .onConflictDoUpdate({
                        target: [
                          TB_supplier_product_price_history.supplierId,
                          TB_supplier_product_price_history.productId,
                          TB_supplier_product_price_history.effectiveDate,
                        ],
                        set: {
                          ...pricing,
                          supplierId: purchaseData.supplier_id,
                          productId: product.productId,
                        },
                      })
                      .returning(),
                  );
                  if (!x) {
                    return yield* Effect.fail(
                      new SeedingFailed({
                        message: "Failed to add product history",
                        service: "org.purchases.products.history",
                      }),
                    );
                  }
                }
              }
              yield* Console.log(`purchase ${purchase.id} added to organization ${org.id}`);
            }
            yield* Console.log("purchases added");
          }
          yield* Console.log(`organizations for user ${user.id} added`);
        }
        yield* Console.log("user added");

        return true;
      });

    return {
      seed,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const SeedLive = SeedService.Default;
