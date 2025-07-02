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
import { InventoryLive, InventoryService } from "../inventory";
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
    const db = yield* DatabaseService;

    const create = Effect.fn("@warehouse/facilities/create")(function* (
      input: InferInput<typeof FacilityCreateSchema>,
    ) {
      const parsedId = safeParse(prefixed_cuid2, input.ownerId);
      if (!parsedId.success) {
        return yield* Effect.fail(new UserInvalidId({ id: input.ownerId }));
      }

      const [facility] = yield* db.insert(TB_warehouse_facilities).values(input).returning();

      if (!facility) {
        return yield* Effect.fail(new FacilityNotCreated({}));
      }

      return facility;
    });

    const findById = Effect.fn("@warehouse/facilities/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new FacilityInvalidId({ id }));
      }

      const facility = yield* db.query.TB_warehouse_facilities.findFirst({
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
      });

      if (!facility) {
        return yield* Effect.fail(new FacilityNotFound({ id }));
      }
      const inventoryService = yield* InventoryService;

      return {
        ...facility,
        areas: yield* Effect.all(
          facility.areas.map((a) =>
            Effect.gen(function* (_) {
              return {
                ...a,
                storages: yield* Effect.all(
                  a.storages.map((s) => Effect.suspend(() => inventoryService.storageStatistics(s.id))),
                ),
              };
            }),
          ),
        ).pipe(Effect.provide(InventoryLive)),
      };
    });

    const update = Effect.fn("@warehouse/facilities/update")(function* (
      input: InferInput<typeof FacilityUpdateSchema>,
    ) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new FacilityInvalidId({ id: input.id }));
      }

      const [updated] = yield* db
        .update(TB_warehouse_facilities)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(TB_warehouse_facilities.id, parsedId.output))
        .returning();

      if (!updated) {
        return yield* Effect.fail(new FacilityNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const remove = Effect.fn("@warehouse/facilities/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new FacilityInvalidId({ id }));
      }

      const [deleted] = yield* db
        .delete(TB_warehouse_facilities)
        .where(eq(TB_warehouse_facilities.id, parsedId.output))
        .returning();

      if (!deleted) {
        return yield* Effect.fail(new FacilityNotDeleted({ id }));
      }

      return deleted;
    });

    const safeRemove = Effect.fn("@warehouse/facilities/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new FacilityInvalidId({ id }));
      }

      const [deleted] = yield* db
        .update(TB_warehouse_facilities)
        .set({ deletedAt: new Date() })
        .where(eq(TB_warehouse_facilities.id, parsedId.output))
        .returning();

      if (!deleted) {
        return yield* Effect.fail(new FacilityNotDeleted({ id }));
      }

      return deleted;
    });

    const all = Effect.fn("@warehouse/facilites/all")(function* () {
      return yield* db.query.TB_warehouse_facilities.findMany({
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
      });
    });

    const findByUserId = Effect.fn("@warehouse/facilities/findByUserId")(function* (userId: string) {
      const parsedId = safeParse(prefixed_cuid2, userId);
      if (!parsedId.success) {
        return yield* Effect.fail(new UserInvalidId({ id: userId }));
      }

      return yield* db.query.TB_warehouse_facilities.findMany({
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
      });
    });

    const findByWarehouseId = Effect.fn("@warehouse/facilites/findByWarehouseId")(function* (warehouseId: string) {
      const parsedWarehouseId = safeParse(prefixed_cuid2, warehouseId);
      if (!parsedWarehouseId.success) {
        return yield* Effect.fail(new WarehouseInvalidId({ id: warehouseId }));
      }
      return yield* db.query.TB_warehouse_facilities.findMany({
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
      });
    });

    return {
      create,
      findById,
      findByUserId,
      findByWarehouseId,
      update,
      remove,
      safeRemove,
      all,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const FacilityLive = FacilityService.Default;

// Type exports
export type FacilityInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<FacilityService["findById"]>>>>;
