import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { TB_warehouse_areas, WarehouseAreaCreateSchema, WarehouseAreaUpdateSchema } from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { FacilityInvalidId, FacilityNotFound } from "../facilities/errors";
import { AreaInvalidId, AreaNotCreated, AreaNotDeleted, AreaNotFound, AreaNotUpdated } from "./errors";

export class AreaService extends Effect.Service<AreaService>()("@warehouse/areas", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const create = (input: InferInput<typeof WarehouseAreaCreateSchema>) =>
      Effect.gen(function* (_) {
        const parsedFacilityId = safeParse(prefixed_cuid2, input.warehouse_facility_id);
        if (!parsedFacilityId.success) {
          return yield* Effect.fail(new FacilityInvalidId({ id: input.warehouse_facility_id }));
        }

        const [area] = yield* Effect.promise(() => db.insert(TB_warehouse_areas).values(input).returning());

        if (!area) {
          return yield* Effect.fail(
            new AreaNotCreated({
              message: "Failed to create area",
            }),
          );
        }

        return area;
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new AreaInvalidId({ id }));
        }

        const area = yield* Effect.promise(() =>
          db.query.TB_warehouse_areas.findFirst({
            where: (areas, operations) => operations.eq(areas.id, parsedId.output),
            with: {
              strs: {
                with: {
                  type: true,
                  secs: {
                    with: {
                      spaces: {
                        with: {
                          labels: true,
                          prs: {
                            with: {
                              pr: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        );

        if (!area) {
          return yield* Effect.fail(new AreaNotFound({ id }));
        }

        return area;
      });

    const update = (input: InferInput<typeof WarehouseAreaUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new AreaInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_warehouse_areas)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_warehouse_areas.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new AreaNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new AreaInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_warehouse_areas).where(eq(TB_warehouse_areas.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new AreaNotDeleted({ id }));
        }

        return deleted;
      });

    const findByFacilityId = (facilityId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, facilityId);
        if (!parsedId.success) {
          return yield* Effect.fail(new FacilityInvalidId({ id: facilityId }));
        }

        return yield* Effect.promise(() =>
          db.query.TB_warehouse_areas.findMany({
            where: (areas, operations) => operations.eq(areas.warehouse_facility_id, parsedId.output),
            with: {
              strs: {
                with: {
                  type: true,
                  secs: {
                    with: {
                      spaces: {
                        with: {
                          labels: true,
                          prs: {
                            with: {
                              pr: true,
                            },
                          },
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

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() =>
          db.query.TB_warehouse_areas.findMany({
            with: {
              strs: {
                with: {
                  type: true,
                  secs: {
                    with: {
                      spaces: {
                        with: {
                          labels: true,
                          prs: {
                            with: {
                              pr: true,
                            },
                          },
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

    return {
      create,
      findById,
      findByFacilityId,
      update,
      remove,
      all,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const AreaLive = AreaService.Default;

// Type exports
export type AreaInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<AreaService["findById"]>>>>;
