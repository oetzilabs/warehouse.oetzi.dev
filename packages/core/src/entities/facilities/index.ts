import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, object, parse, safeParse, type InferInput } from "valibot";
import {
  FacilityCreateSchema,
  FacilityUpdateSchema,
  TB_devices,
  TB_warehouse_areas,
  TB_warehouse_facilities,
  WarehouseAreaCreateSchema,
  WarehouseAreaUpdateSchema,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { StorageInfo, StorageLive, StorageService } from "../storages";
import { StorageInvalidId, StorageNotFound } from "../storages/errors";
import { UserInvalidId } from "../users/errors";
import { WarehouseInvalidId, WarehouseNotFound, WarehouseNotUpdated } from "../warehouses/errors";
import {
  FacilityInvalidId,
  FacilityNotCreated,
  FacilityNotDeleted,
  FacilityNotFound,
  FacilityNotUpdated,
} from "./errors";

export class FacilityService extends Effect.Service<FacilityService>()("@warehouse/facilities", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const create = (input: InferInput<typeof FacilityCreateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.ownerId);
        if (!parsedId.success) {
          return yield* Effect.fail(new UserInvalidId({ id: input.ownerId }));
        }

        const [facility] = yield* Effect.promise(() => db.insert(TB_warehouse_facilities).values(input).returning());

        if (!facility) {
          return yield* Effect.fail(new FacilityNotCreated({}));
        }

        return facility;
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new FacilityInvalidId({ id }));
        }

        const facility = yield* Effect.promise(() =>
          db.query.TB_warehouse_facilities.findFirst({
            where: (facilities, operations) => operations.eq(facilities.id, parsedId.output),
            with: {
              areas: {
                with: {
                  storages: {
                    with: {
                      type: true,
                      area: true,
                      products: {
                        with: {
                          product: true,
                        },
                      },
                      labels: true,
                      parent: true,
                      children: true,
                    },
                  },
                },
              },
            },
          }),
        );

        if (!facility) {
          return yield* Effect.fail(new FacilityNotFound({ id }));
        }

        const deepStorageChildren = (
          storage: StorageInfo,
        ): Effect.Effect<StorageInfo, StorageNotFound | StorageInvalidId> =>
          Effect.gen(function* (_) {
            const storageService = yield* _(StorageService);
            const s = yield* storageService.findById(storage.id);
            if (!s) {
              return storage;
            }

            if (!s.children || s.children.length === 0) {
              return s;
            }

            const c_children = yield* Effect.all(
              s.children.map((child) => Effect.suspend(() => deepStorageChildren(child as StorageInfo))),
            );

            return {
              ...s,
              children: c_children,
            } satisfies StorageInfo;
          }).pipe(Effect.provide(StorageLive));

        return {
          ...facility,
          areas: yield* Effect.all(
            facility.areas.map((a) =>
              Effect.gen(function* (_) {
                return {
                  ...a,
                  storages: yield* Effect.all(a.storages.map((s) => Effect.suspend(() => deepStorageChildren(s)))),
                };
              }),
            ),
          ),
        };
      });

    const update = (input: InferInput<typeof FacilityUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new FacilityInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_warehouse_facilities)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_warehouse_facilities.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new FacilityNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new FacilityInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_warehouse_facilities).where(eq(TB_warehouse_facilities.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new FacilityNotDeleted({ id }));
        }

        return deleted;
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() =>
          db.query.TB_warehouse_facilities.findMany({
            with: {
              areas: {
                with: {
                  storages: {
                    with: {
                      type: true,
                      area: true,
                      products: true,
                      children: true,
                    },
                  },
                },
              },
            },
          }),
        );
      });

    const findByUserId = (userId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, userId);
        if (!parsedId.success) {
          return yield* Effect.fail(new UserInvalidId({ id: userId }));
        }

        return yield* Effect.promise(() =>
          db.query.TB_warehouse_facilities.findMany({
            where: (facilities, operations) => operations.eq(facilities.ownerId, parsedId.output),
            with: {
              areas: {
                with: {
                  storages: {
                    with: {
                      type: true,
                      area: true,
                      products: true,
                      children: true,
                    },
                  },
                },
              },
            },
          }),
        );
      });

    const findByWarehouseId = (warehouseId: string) =>
      Effect.gen(function* (_) {
        const parsedWarehouseId = safeParse(prefixed_cuid2, warehouseId);
        if (!parsedWarehouseId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id: warehouseId }));
        }
        return yield* Effect.promise(() =>
          db.query.TB_warehouse_facilities.findMany({
            where: (fields, operations) => operations.eq(fields.warehouse_id, parsedWarehouseId.output),
            with: {
              areas: {
                with: {
                  storages: {
                    with: {
                      type: true,
                      area: true,
                      products: true,
                      children: true,
                    },
                  },
                },
              },
            },
          }),
        );
      });

    return {
      create,
      findById,
      findByUserId,
      findByWarehouseId,
      update,
      remove,
      all,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const FacilityLive = FacilityService.Default;

// Type exports
export type FacilityInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<FacilityService["findById"]>>>>;
