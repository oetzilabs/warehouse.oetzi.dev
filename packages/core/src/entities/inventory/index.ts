import { Console, Effect } from "effect";
import { safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
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

        // using a map, we are going to count the products of the same product.id
        const productsWithStock = new Map<string, { product: any; count: number }>();
        for (const product of products) {
          const existing = productsWithStock.get(product.productId);
          if (existing) {
            existing.count += 1;
          } else {
            productsWithStock.set(product.productId, { product, count: 1 });
          }
        }

        const c = yield* Effect.promise(() =>
          db.query.TB_storage_to_products.findMany({
            where: (fields, operations) =>
              operations.inArray(
                fields.productId,
                products.map((p) => p.productId),
              ),
            with: {
              storage: true,
            },
          }),
        );

        const storages = yield* Effect.promise(() =>
          db.query.TB_storages.findMany({
            where: (fields, operations) =>
              operations.inArray(
                fields.id,
                c.map((c) => c.storage.id),
              ),
          }),
        );

        const storageDeep = yield* Effect.all(storages.map((s) => Effect.suspend(() => storageList(s.id))));

        const c2 = yield* Effect.all(storages.map((s) => Effect.suspend(() => storageCapacity(s.id))));
        const capacity = c2.reduce((acc, a) => acc + a, 0);

        return {
          capacity,
          storages: storageDeep.flat(),
          products: Array.from(productsWithStock.values()),
        };
      });

    const storageBox = (storageId: string) =>
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

    const storageList = (
      storageId: string,
    ): Effect.Effect<Effect.Effect.Success<ReturnType<typeof storageBox>>[], StorageInvalidId | StorageNotFound> =>
      Effect.gen(function* (_) {
        const storage = yield* storageBox(storageId);

        if (storage.children.length === 0) {
          return [storage];
        }

        const children = yield* Effect.all(
          storage.children.map((child) => Effect.suspend(() => storageList(child.id))),
        );

        return children.flat();
      });

    const storageParent = (storageId: string) =>
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
            },
          }),
        );

        if (!storage) {
          return yield* Effect.fail(new StorageNotFound({ id: storageId }));
        }

        return storage.parent;
      });

    const storageCapacity = (
      storageId: string,
    ): Effect.Effect<number, StorageInvalidId | StorageNotFound | OrganizationInvalidId> =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, storageId);
        if (!parsedId.success) {
          return yield* Effect.fail(new StorageInvalidId({ id: storageId }));
        }

        const storage = yield* Effect.promise(() =>
          db.query.TB_storages.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: {
              children: true,
            },
          }),
        );

        if (!storage) {
          return yield* Effect.fail(new StorageNotFound({ id: storageId }));
        }

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

    return {
      statistics,
      alerts,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const InventoryLive = InventoryService.Default;

// Type exports
export type InventoryInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<InventoryService["statistics"]>>>>;
