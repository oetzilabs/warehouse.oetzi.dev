import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, InferInput, object, parse, safeParse } from "valibot";
import storage_inventories from "../../data/storage_inventories.json";
import storage_types from "../../data/storage_types.json";
import storages from "../../data/storages.json";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  StorageCreateSchema,
  StorageInventoryCreateSchema,
  StorageInventoryUpdateSchema,
  StorageTypeCreateSchema,
  StorageTypeUpdateSchema,
  StorageUpdateSchema,
  TB_storage_inventory,
  TB_storage_types,
  TB_storages,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { StorageInvalidId, StorageNotCreated, StorageNotDeleted, StorageNotFound, StorageNotUpdated } from "./errors";

export class StorageService extends Effect.Service<StorageService>()("@warehouse/storages", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_storages.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => ({
      area: true,
      type: true,
    });

    const create = (input: InferInput<typeof StorageCreateSchema>) =>
      Effect.gen(function* (_) {
        const [storage] = yield* Effect.promise(() => db.insert(TB_storages).values(input).returning());
        if (!storage) {
          return yield* Effect.fail(new StorageNotCreated());
        }
        return findById(storage.id);
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const rels = relations ?? withRelations();
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new StorageInvalidId({ id }));
        }

        const storage = yield* Effect.promise(() =>
          db.query.TB_storages.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: rels,
          }),
        );

        if (!storage) {
          return yield* Effect.fail(new StorageNotFound({ id }));
        }

        return storage;
      });

    const update = (id: string, input: InferInput<typeof StorageUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new StorageInvalidId({ id }));
        }

        const [storage] = yield* Effect.promise(() =>
          db
            .update(TB_storages)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_storages.id, parsedId.output))
            .returning(),
        );

        if (!storage) {
          return yield* Effect.fail(new StorageNotUpdated({ id }));
        }

        return storage;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new StorageInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_storages).where(eq(TB_storages.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new StorageNotDeleted({ id }));
        }

        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) return yield* Effect.fail(new StorageInvalidId({ id }));
        const [deleted] = yield* Effect.promise(() =>
          db.update(TB_storages).set({ deletedAt: new Date() }).where(eq(TB_storages.id, parsedId.output)).returning(),
        );
        return deleted;
      });

    const findByAreaId = (areaId: string) =>
      Effect.gen(function* (_) {
        const parsedAreaId = safeParse(prefixed_cuid2, areaId);
        if (!parsedAreaId.success) {
          return yield* Effect.fail(new StorageInvalidId({ id: areaId }));
        }
        const storages = yield* Effect.promise(() =>
          db.query.TB_storages.findMany({
            where: (fields, operations) => operations.eq(fields.warehouseAreaId, parsedAreaId.output),
            with: withRelations(),
          }),
        );
        return storages;
      });

    const seed = () =>
      Effect.gen(function* (_) {
        const dbStorageTypes = yield* Effect.promise(() => db.query.TB_storage_types.findMany());

        const storageTypes = parse(
          array(
            object({
              ...StorageTypeCreateSchema.entries,
              id: prefixed_cuid2,
            }),
          ),
          storage_types,
        );

        const existingStorageTypes = dbStorageTypes.map((u) => u.id);

        const toCreateStorageTypes = storageTypes.filter((t) => !existingStorageTypes.includes(t.id));

        if (toCreateStorageTypes.length > 0) {
          yield* Effect.promise(() => db.insert(TB_storage_types).values(toCreateStorageTypes).returning());
          yield* Effect.log("Created storage types", toCreateStorageTypes);
        }

        const toUpdateStorageTypes = storageTypes.filter((t) => existingStorageTypes.includes(t.id));
        if (toUpdateStorageTypes.length > 0) {
          for (const storageType of toUpdateStorageTypes) {
            yield* Effect.promise(() =>
              db
                .update(TB_storage_types)
                .set({ ...storageType, updatedAt: new Date() })
                .where(eq(TB_storage_types.id, storageType.id))
                .returning(),
            );
          }
        }

        const dbStorages = yield* Effect.promise(() => db.query.TB_storages.findMany());
        const existingStorages = dbStorages.map((u) => u.id);

        const storage_list = parse(
          array(
            object({
              ...StorageCreateSchema.entries,
              id: prefixed_cuid2,
            }),
          ),
          storages,
        );

        const toCreateStorages = storage_list.filter((t) => !existingStorages.includes(t.id));

        if (toCreateStorages.length > 0) {
          yield* Effect.promise(() => db.insert(TB_storages).values(toCreateStorages).returning());
          yield* Effect.log("Created storages", toCreateStorages);
        }

        const toUpdateStorages = storage_list.filter((t) => existingStorages.includes(t.id));
        if (toUpdateStorages.length > 0) {
          for (const storage of toUpdateStorages) {
            yield* Effect.promise(() =>
              db
                .update(TB_storages)
                .set({ ...storage, updatedAt: new Date() })
                .where(eq(TB_storages.id, storage.id))
                .returning(),
            );
          }
        }

        const dbStorageInventories = yield* Effect.promise(() => db.query.TB_storage_inventory.findMany());
        const existingStorageInventories = dbStorageInventories.map((u) => u.id);

        const storageInventories = parse(
          array(
            object({
              ...StorageInventoryCreateSchema.entries,
              id: prefixed_cuid2,
            }),
          ),
          storage_inventories,
        );

        const toCreateStorageInventories = storageInventories.filter((t) => !existingStorageInventories.includes(t.id));

        if (toCreateStorageInventories.length > 0) {
          yield* Effect.promise(() => db.insert(TB_storage_inventory).values(toCreateStorageInventories).returning());
          yield* Effect.log("Created storage inventories", toCreateStorageInventories);
        }

        const toUpdateStorageInventories = storageInventories.filter((t) => existingStorageInventories.includes(t.id));
        if (toUpdateStorageInventories.length > 0) {
          for (const storageInventory of toUpdateStorageInventories) {
            yield* Effect.promise(() =>
              db
                .update(TB_storage_inventory)
                .set({ ...storageInventory, updatedAt: new Date() })
                .where(eq(TB_storage_inventory.id, storageInventory.id))
                .returning(),
            );
          }
        }

        return storage_list;
      });

    return { create, findById, update, remove, safeRemove, findByAreaId, seed } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const StorageLive = StorageService.Default;
export type StorageInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<StorageService["findById"]>>>>;
