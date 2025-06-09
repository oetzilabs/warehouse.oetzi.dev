import { count, inArray } from "drizzle-orm";
import { Console, Effect } from "effect";
import { safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { TB_storage_to_products } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationInvalidId } from "../organizations/errors";
import { StorageInfo } from "../storages";
import { StorageInvalidId, StorageNotFound } from "../storages/errors";

export class InventoryService extends Effect.Service<InventoryService>()("@warehouse/inventory", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const statistics = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const products = yield* Effect.promise(() =>
          db.query.TB_organizations_products.findMany({
            where: (fields, operations) => operations.eq(fields.organizationId, parsedId.output),
          }),
        );

        const productCounts = yield* Effect.promise(() =>
          db
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
            .groupBy(TB_storage_to_products.productId),
        );

        // Update the productsWithStock map with counts from query
        const productsWithStock = yield* Effect.all(
          productCounts.map((p) =>
            Effect.gen(function* (_) {
              const product = yield* Effect.promise(() =>
                db.query.TB_products.findFirst({
                  where: (fields, operations) => operations.eq(fields.id, p.productId),
                }),
              );
              return {
                product: product!,
                count: p.count,
              };
            }),
          ),
        );

        const warehouses = yield* Effect.promise(() =>
          db.query.TB_organizations_warehouses.findMany({
            where: (fields, operations) => operations.eq(fields.organizationId, parsedId.output),
          }),
        );

        const facilities = yield* Effect.promise(() =>
          db.query.TB_warehouse_facilities.findMany({
            where: (fields, operations) =>
              operations.inArray(
                fields.warehouse_id,
                warehouses.map((w) => w.warehouseId),
              ),
          }),
        );

        const areas = yield* Effect.promise(() =>
          db.query.TB_warehouse_areas.findMany({
            where: (fields, operations) =>
              operations.inArray(
                fields.warehouse_facility_id,
                facilities.map((f) => f.id),
              ),
          }),
        );

        const storages = yield* Effect.promise(() =>
          db.query.TB_storages.findMany({
            where: (fields, operations) =>
              operations.and(
                operations.inArray(
                  fields.warehouseAreaId,
                  areas.map((a) => a.id),
                ),
                operations.isNull(fields.parentId),
              ),
          }),
        );

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

    const sb = (storageId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, storageId);
        if (!parsedId.success) {
          return yield* Effect.fail(new StorageInvalidId({ id: storageId }));
        }

        const storage = yield* Effect.promise(() =>
          db.query.TB_storages.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: {
              parent: true,
              products: {
                with: {
                  product: true,
                },
              },
              children: true,
              labels: true,
            },
          }),
        );
        if (!storage) {
          return yield* Effect.fail(new StorageNotFound({ id: storageId }));
        }
        return storage;
      });

    const storageBox = (
      storageId: string,
    ): Effect.Effect<
      Effect.Effect.Success<ReturnType<typeof sb>> & { productSummary: any[] },
      StorageInvalidId | StorageNotFound
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
          productSummary,
          children: childrenStorages,
        };
      });

    const productCount = (storageId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, storageId);
        if (!parsedId.success) {
          return yield* Effect.fail(new StorageInvalidId({ id: storageId }));
        }

        const products = yield* Effect.promise(() =>
          db.query.TB_storage_to_products.findMany({
            where: (fields, operations) => operations.eq(fields.storageId, parsedId.output),
          }),
        );
        if (products.length > 0) {
          return products.length;
        }
        return 0;
      });

    const storageList = (
      storageId: string,
    ): Effect.Effect<
      Effect.Effect.Success<ReturnType<typeof storageBox>> & { childrenCapacity: number; productsCount: number },
      StorageInvalidId | StorageNotFound
    > =>
      Effect.gen(function* (_) {
        const storage = yield* storageBox(storageId);

        const productsCount = yield* productCount(storage.id);
        if (storage.children.length === 0) {
          return { ...storage, childrenCapacity: storage.capacity, productsCount };
        }

        const children = yield* Effect.all(
          storage.children.map((child) => Effect.suspend(() => storageList(child.id))),
        );

        const childrenCapacity = yield* Effect.all(children.map((c) => Effect.suspend(() => storageCapacity(c.id))));

        const pc = yield* Effect.all(children.map((c) => Effect.suspend(() => productCount(c.id))));

        return {
          ...storage,
          children: children.flat(),
          childrenCapacity: childrenCapacity.reduce((acc, c) => acc + c, 0),
          productsCount: pc.reduce((acc, c) => acc + c, 0),
        };
      });

    const storageCapacity = (storageId: string): Effect.Effect<number, StorageInvalidId | StorageNotFound> =>
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

    const alerts = (organizationId: string) =>
      Effect.gen(function* (_) {
        const { products } = yield* statistics(organizationId);

        // check if the storage where the product count is less then the products minimumStock, by checking if the capacity of the storage is less than the product count too.
        const productsWithAlerts = products.filter((p) => p.count < p.product.minimumStock);

        return productsWithAlerts;
      });

    const storageStatistics = (storageId: string) =>
      Effect.gen(function* (_) {
        const storage = yield* storageBox(storageId);
        const storageDeep = yield* storageList(storage.id);
        const children = yield* Effect.all(
          storageDeep.children.map((child) => Effect.suspend(() => storageList(child.id))),
        );

        const c2 = yield* Effect.all(children.map((c) => Effect.suspend(() => storageCapacity(c.id))));

        return {
          capacity: c2,
          storages: children,
        };
      });

    return { storageStatistics, statistics, alerts, storageCapacity, productCount } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const InventoryLive = InventoryService.Default;

// Type exports
export type InventoryInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<InventoryService["statistics"]>>>>;
export type StorageStatisticsInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<InventoryService["storageStatistics"]>>>
>;
