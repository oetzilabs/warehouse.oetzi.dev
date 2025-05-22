import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, object, parse, safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  FacilityCreateSchema,
  FacilityUpdateSchema,
  TB_devices,
  TB_warehouse_areas,
  TB_warehouse_facilities,
  WarehouseAreaCreateSchema,
  WarehouseAreaUpdateSchema,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
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
              devices: true,
              ars: {
                with: {
                  strs: {
                    with: {
                      type: true,
                      area: true,
                      invs: {
                        with: {
                          labels: true,
                        },
                      },
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

        return facility;
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
              devices: true,
              ars: {
                with: {
                  strs: {
                    with: {
                      type: true,
                      area: true,
                      invs: {
                        with: {
                          labels: true,
                        },
                      },
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
              devices: true,
              ars: {
                with: {
                  strs: {
                    with: {
                      type: true,
                      area: true,
                      invs: {
                        with: {
                          labels: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        );
      });

    const findDevicesByFacilityId = (facilityId: string) =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() =>
          db.query.TB_devices.findMany({
            where: (fields, operations) => operations.eq(fields.facility_id, facilityId),
          }),
        );
      });

    return {
      create,
      findById,
      findByUserId,
      update,
      remove,
      all,
      findDevicesByFacilityId,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const FacilityLive = FacilityService.Default;

// Type exports
export type FacilityInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<FacilityService["findById"]>>>>;
