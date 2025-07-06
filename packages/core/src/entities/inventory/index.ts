import { SqlError } from "@effect/sql/SqlError";
import { and, count, eq, inArray } from "drizzle-orm";
import { Console, Effect } from "effect";
import { array, safeParse } from "valibot";
import { TB_storage_to_products } from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationInvalidId } from "../organizations/errors";
import { OrganizationId } from "../organizations/id";
import { ProductLive, ProductService } from "../products";
import { ProductInvalidId, ProductNotFound } from "../products/errors";
import { StorageInfo } from "../storages";
import { StorageInvalidId, StorageNotFound } from "../storages/errors";
import { InvalidProductIds } from "./errors";

export class InventoryService extends Effect.Service<InventoryService>()("@warehouse/inventory", {
  effect: Effect.gen(function* (_) {
    const db = yield* DatabaseService;
    const productService = yield* ProductService;

    const statistics = Effect.fn("@warehouse/inventory/statistics")(function* () {
      const orgId = yield* OrganizationId;

      const products = yield* db.query.TB_organizations_products.findMany({
        where: (fields, operations) => operations.eq(fields.organizationId, orgId),
      });

      const productCounts = yield* db
        .select({
          productId: TB_storage_to_products.productId,
          count: count(),
        })
        .from(TB_storage_to_products)
        .where(
          inArray(
            TB_storage_to_products.productId,
            products.map((p) => p.productId),
          ),
        )
        .groupBy(TB_storage_to_products.productId);

      // Update the productsWithStock map with counts from query
      const productsWithStock = yield* Effect.all(
        productCounts.map((p) =>
          Effect.gen(function* (_) {
            const product = yield* db.query.TB_products.findFirst({
              where: (fields, operations) => operations.eq(fields.id, p.productId),
              with: {
                organizations: true,
                brands: true,
                suppliers: {
                  with: {
                    supplier: {
                      with: {
                        purchases: {
                          with: {
                            products: {
                              with: {
                                product: true,
                              },
                            },
                          },
                        },
                        schedules: {
                          with: {
                            schedule: true,
                          },
                        },
                        contacts: true,
                      },
                    },
                  },
                },
              },
            });
            return {
              product: {
                ...product!,
                organizations: product!.organizations.filter((o) => o.organizationId === orgId),
                reorderPoint: product!.organizations.find((o) => o.organizationId === orgId)?.reorderPoint ?? 0,
                minimumStock: product!.organizations.find((o) => o.organizationId === orgId)?.minimumStock ?? 0,
              },
              count: p.count,
            };
          }),
        ),
      );

      const warehouses = yield* db.query.TB_organizations_warehouses.findMany({
        where: (fields, operations) => operations.eq(fields.organizationId, orgId),
      });

      const facilities = yield* db.query.TB_warehouse_facilities.findMany({
        where: (fields, operations) =>
          operations.inArray(
            fields.warehouse_id,
            warehouses.map((w) => w.warehouseId),
          ),
      });

      const areas = yield* db.query.TB_warehouse_areas.findMany({
        where: (fields, operations) =>
          operations.inArray(
            fields.warehouse_facility_id,
            facilities.map((f) => f.id),
          ),
      });

      const storages = yield* db.query.TB_storages.findMany({
        where: (fields, operations) =>
          operations.and(
            operations.inArray(
              fields.warehouseAreaId,
              areas.map((a) => a.id),
            ),
            operations.isNull(fields.parentId),
          ),
      });

      const storageDeep = yield* Effect.all(storages.map((s) => Effect.suspend(() => storageList(s.id))));

      const c2 = yield* Effect.all(storageDeep.map((s) => Effect.suspend(() => storageCapacity(s.id))));
      const capacity = c2.reduce((acc, a) => acc + a, 0);

      return {
        capacity,
        storages: storageDeep,
        products: productsWithStock,
      };
    });

    const summarizeProducts = <P extends { id: string }, T extends { product: P }>(products: T[]) => {
      const summary = new Map<string, { product: any; count: number }>();
      products.forEach((p) => {
        const existing = summary.get(p.product.id);
        if (existing) {
          existing.count += 1;
        } else {
          summary.set(p.product.id, { product: p.product, count: 1 });
        }
      });
      return Array.from(summary.values());
    };

    const sb = Effect.fn("@warehouse/inventory/sb")(function* (storageId: string) {
      const parsedId = safeParse(prefixed_cuid2, storageId);
      if (!parsedId.success) {
        return yield* Effect.fail(new StorageInvalidId({ id: storageId }));
      }

      const storage = yield* db.query.TB_storages.findFirst({
        where: (fields, operations) => operations.eq(fields.id, parsedId.output),
        with: {
          parent: true,
          products: {
            with: {
              product: true,
            },
          },
          children: true,
          type: true,
          labels: true,
        },
      });
      if (!storage) {
        return yield* Effect.fail(new StorageNotFound({ id: storageId }));
      }
      return storage;
    });

    type ProductSummary = {
      product: Effect.Effect.Success<ReturnType<typeof sb>>["products"][number]["product"];
      count: number;
    };

    const storageBox = (
      storageId: string,
    ): Effect.Effect<
      Effect.Effect.Success<ReturnType<typeof sb>> & { productSummary: ProductSummary[] },
      StorageInvalidId | StorageNotFound | SqlError
    > =>
      Effect.gen(function* (_) {
        const storage = yield* sb(storageId);

        if (storage.children.length === 0) {
          return {
            ...storage,
            productSummary: summarizeProducts(storage.products),
          };
        }

        const childrenStorages = yield* Effect.all(
          storage.children.map((child) => Effect.suspend(() => storageBox(child.id))),
        );

        // Collect all products from current storage and children
        const allProducts = [...storage.products, ...childrenStorages.flatMap((s) => s.products)];

        const productSummary = summarizeProducts(allProducts);

        return {
          ...storage,
          products: storage.products ?? [],
          productSummary,
          children: childrenStorages,
        };
      });

    const storageStatus = (
      storageId: string,
    ): Effect.Effect<
      "low" | "below-reorder" | "below-capacity" | "optimal" | "empty",
      StorageInvalidId | StorageNotFound | OrganizationInvalidId | ProductInvalidId | ProductNotFound | SqlError,
      OrganizationId
    > =>
      Effect.gen(function* (_) {
        const storage = yield* storageBox(storageId);
        const children = storage.children;
        const pc = (yield* Effect.all(children.map((c) => Effect.suspend(() => productCountByStorageId(c.id))))).reduce(
          (acc, c) => acc + c,
          0,
        );

        // TODO: Calculate status, based on productsCount and childrenCapacity. Status can be "low", "near-min", "below-reorder", "optimal", "has-products", "empty"
        let status: "low" | "below-reorder" | "below-capacity" | "optimal" | "empty" = "empty";
        if (storage.products.length > 0) {
          status = "low";
        }
        const ccp = storage.children.reduce((acc, c) => acc + c.capacity, 0);
        if (pc < ccp) {
          status = "below-capacity";
          return status;
        }

        const products = yield* Effect.all(storage.products.map((p) => productService.findById(p.productId)));
        const removedDuplicates = products.filter((p, i) => products.findIndex((p2) => p2.id === p.id) === i);
        const prs = yield* Effect.all(
          removedDuplicates.map((p) =>
            Effect.gen(function* () {
              const pCount = yield* productCountByProductIdAndStorageId(p.id, storage.id);
              return {
                ...p,
                count: pCount[p.id],
              };
            }),
          ),
        );

        const productsWithCount = prs.filter((p) => p.count > 0);

        status = productsWithCount.some((p) => p.count < (p.reorderPoint ?? p.minimumStock ?? Infinity))
          ? "below-reorder"
          : "optimal";

        return status;
      });

    const productCountByStorageId = Effect.fn("@warehouse/inventory/productCountByStorageId")(function* (
      storageId: string,
    ) {
      const parsedId = safeParse(prefixed_cuid2, storageId);
      if (!parsedId.success) {
        return yield* Effect.fail(new StorageInvalidId({ id: storageId }));
      }

      const products = yield* db.query.TB_storage_to_products.findMany({
        where: (fields, operations) => operations.eq(fields.storageId, parsedId.output),
      });
      if (products.length > 0) {
        return products.length;
      }
      return 0;
    });

    const storageList = (
      storageId: string,
    ): Effect.Effect<
      Omit<Effect.Effect.Success<ReturnType<typeof storageBox>>, "products"> & {
        // productSummary: ProductSummary[];
        childrenCapacity: number;
        productsCount: number;
        status: Effect.Effect.Success<ReturnType<typeof storageStatus>>;
        children: Effect.Effect.Success<ReturnType<typeof storageBox>>["children"];
        products: Effect.Effect.Success<ReturnType<typeof productService.findById>>[];
      },
      StorageInvalidId | StorageNotFound | ProductInvalidId | ProductNotFound | OrganizationInvalidId | SqlError,
      OrganizationId
    > =>
      Effect.gen(function* (_) {
        const storage = yield* storageBox(storageId);

        const children = yield* Effect.all(
          storage.children.map((child) => Effect.suspend(() => storageList(child.id))),
        );

        const childrenCapacity = yield* storageCapacity(storage.id);

        const products = yield* Effect.all(storage.products.map((p) => productService.findById(p.productId)));

        const status = yield* storageStatus(storage.id);

        return {
          ...storage,
          products,
          productsCount: storage.productSummary.reduce((acc, p) => acc + p.count, 0),
          children,
          childrenCapacity,
          status,
        };
      });

    const productCountByProductIdAndStorageId = Effect.fn("@warehouse/inventory/productCountByProductIdAndStorageId")(
      function* (storageId: string, productId: string) {
        const parsedId = safeParse(prefixed_cuid2, productId);
        if (!parsedId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: productId }));
        }
        const parsedStorageId = safeParse(prefixed_cuid2, storageId);
        if (!parsedStorageId.success) {
          return yield* Effect.fail(new StorageInvalidId({ id: storageId }));
        }

        const products = yield* db.query.TB_storage_to_products.findMany({
          where: (fields, operations) =>
            operations.and(
              operations.eq(fields.productId, parsedId.output),
              operations.eq(fields.storageId, storageId),
            ),
        });
        if (!products) {
          return yield* Effect.fail(new ProductNotFound({ id: productId }));
        }
        return yield* Effect.succeed({ [productId]: products.length });
      },
    );
    const productCountByProductId = Effect.fn("@warehouse/inventory/productCountByProductId")(function* (
      productId: string,
    ) {
      const parsedId = safeParse(prefixed_cuid2, productId);
      if (!parsedId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: productId }));
      }

      const products = yield* db.query.TB_storage_to_products.findMany({
        where: (fields, operations) => operations.eq(fields.productId, parsedId.output),
      });
      if (!products) {
        return yield* Effect.fail(new ProductNotFound({ id: productId }));
      }
      return products.length;
    });

    const storageCapacity = (storageId: string): Effect.Effect<number, StorageInvalidId | StorageNotFound | SqlError> =>
      Effect.gen(function* (_) {
        const storage = yield* storageBox(storageId);

        if (storage.children.length === 0) {
          return storage.capacity;
        }

        const childrenCapacity = yield* Effect.all(
          storage.children.map((child) => Effect.suspend(() => storageCapacity(child.id))),
        );

        return childrenCapacity.reduce((acc, c) => acc + c, 0);
      });

    const alerts = Effect.fn("@warehouse/inventory/alerts")(function* () {
      const orgId = yield* OrganizationId;
      const { products } = yield* statistics();

      const productsWithAlerts = products
        .filter((p) => p.count < (p.product.reorderPoint ?? p.product.minimumStock))
        .map((p) => ({
          ...p,
          product: {
            ...p.product,
            lastPurchase: p.product.suppliers
              .flatMap((s) => s.supplier.purchases)
              // First get purchases for this organization
              .filter((po) => po.organization_id === orgId)
              // Then filter completed ones
              .filter((po) => po.status === "completed")
              // Sort by date descending (most recent first)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0], // Get the most recent one
          },
        }));

      return productsWithAlerts;
    });

    const storageStatistics = Effect.fn("@warehouse/inventory/storageStatistics")(function* (storageId: string) {
      const storage = yield* storageBox(storageId);
      const storageDeep = yield* storageList(storage.id);
      const children = yield* Effect.all(storageDeep.children.map((child) => storageList(child.id)));

      const c2 = yield* Effect.all(children.map((c) => storageCapacity(c.id)));

      return {
        capacity: c2.reduce((acc, c) => acc + c, 0),
        storages: children,
      };
    });

    const getStockForProducts = Effect.fn("@warehouse/inventory/getStockForProducts")(function* (productIds: string[]) {
      const parsedIds = safeParse(array(prefixed_cuid2), productIds);
      if (!parsedIds.success) {
        return yield* Effect.fail(new InvalidProductIds({ ids: productIds }));
      }
      const orgId = yield* OrganizationId;
      const products = yield* db.query.TB_products.findMany({
        where: (fields, operations) => operations.inArray(fields.id, parsedIds.output),
      });
      // if (products.length === 0) {
      //   return yield* Effect.fail(new Error("No products found"));
      // }
      const ids = products.map((p) => p.id);

      const productsInOrganization: string[] = [];
      for (const productId of ids) {
        const orgProduct = yield* db.query.TB_organizations_products.findFirst({
          where: (fields, operations) =>
            operations.and(operations.eq(fields.productId, productId), operations.eq(fields.organizationId, orgId)),
        });
        if (orgProduct) {
          productsInOrganization.push(productId);
        }
      }

      // get all the root storages of all warehouses in the organization
      const warehouses = yield* db.query.TB_organizations_warehouses.findMany({
        where: (fields, operations) => operations.eq(fields.organizationId, orgId),
        with: {
          warehouse: {
            with: {
              facilities: {
                with: {
                  areas: {
                    with: {
                      storages: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const storages = yield* Effect.all(
        warehouses
          .flatMap((w) => w.warehouse.facilities.flatMap((f) => f.areas.flatMap((a) => a.storages.map((s) => s.id))))
          .map((sid) => storageList(sid)),
      );

      const xStock = storages.flatMap((s) =>
        s.productSummary
          .filter((ps) => productsInOrganization.includes(ps.product.id))
          .map((ps) => ({ productId: ps.product.id, stock: ps.count })),
      );

      return xStock;
    });

    const updateInventoryForProduct = Effect.fn("@warehouse/inventory/updateInventoryForProduct")(function* (
      productId: string,
      data: { storageId: string; amount: number },
    ) {
      const parsedId = safeParse(prefixed_cuid2, productId);
      if (!parsedId.success) {
        return yield* Effect.fail(new Error("Invalid product id"));
      }
      const product = yield* db.query.TB_products.findFirst({
        where: (fields, operations) => operations.eq(fields.id, parsedId.output),
      });
      if (!product) {
        return yield* Effect.fail(new Error("Product not found"));
      }
      const parsedStorageId = safeParse(prefixed_cuid2, data.storageId);
      if (!parsedStorageId.success) {
        return yield* Effect.fail(new Error("Invalid storage id"));
      }
      const storage = yield* storageBox(parsedStorageId.output);
      if (!storage) {
        return yield* Effect.fail(new StorageNotFound({ id: data.storageId }));
      }
      // we gotta update the junction table of the storage to product, by checking how many products are in the storage.
      const storageProducts = yield* db.query.TB_storage_to_products.findMany({
        where: (fields, operations) =>
          operations.and(
            operations.eq(fields.productId, parsedId.output),
            operations.eq(fields.storageId, parsedStorageId.output),
          ),
      });
      if (storageProducts.length === data.amount) {
        // nothing to update
        return yield* Effect.succeed(data);
      }
      if (storageProducts.length > data.amount) {
        // we need to remove some products
        const productsToRemove = storageProducts.slice(data.amount);
        const productsToRemoveIds = productsToRemove.map((p) => p.productId);
        yield* db
          .delete(TB_storage_to_products)
          .where(
            and(
              eq(TB_storage_to_products.storageId, parsedStorageId.output),
              inArray(TB_storage_to_products.productId, productsToRemoveIds),
            ),
          )
          .returning();
        return yield* Effect.succeed({ ...data, amount: storageProducts.length });
      }
      if (storageProducts.length < data.amount) {
        // we need to add some products
        const productsToAddIds = Array.from({ length: data.amount - storageProducts.length }, () => ({
          productId: parsedId.output,
          storageId: parsedStorageId.output,
        }));

        yield* db.insert(TB_storage_to_products).values(productsToAddIds).returning();
        return yield* Effect.succeed({ ...data, amount: storageProducts.length });
      }
    });

    return {
      storageStatistics,
      statistics,
      alerts,
      storageCapacity,
      productCountByStorageId,
      getStockForProducts,
      updateInventoryForProduct,
    } as const;
  }),
  dependencies: [DatabaseLive, ProductLive],
}) {}

export const InventoryLive = InventoryService.Default;

// Type exports
export type InventoryInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<InventoryService["statistics"]>>>>;
export type StorageStatisticsInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<InventoryService["storageStatistics"]>>>
>;
export type InventoryAlertInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<InventoryService["alerts"]>>>>;
