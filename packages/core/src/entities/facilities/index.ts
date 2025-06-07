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
              ars: {
                with: {
                  strs: {
                    with: {
                      type: true,
                      area: true,
                      invs: {
                        with: {
                          products: {
                            with: {
                              product: {
                                with: {
                                  brands: true,
                                  catalogs: true,
                                  labels: true,
                                  suppliers: true,
                                },
                              },
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

        if (!facility) {
          return yield* Effect.fail(new FacilityNotFound({ id }));
        }

        return {
          id: facility.id,
          name: facility.name,
          description: facility.description,
          boundingBox: facility.bounding_box,
          createdAt: facility.createdAt,
          updatedAt: facility.updatedAt,
          deletedAt: facility.deletedAt,
          areas: facility.ars.map((area) => ({
            id: area.id,
            name: area.name,
            description: area.description,
            boundingBox: area.bounding_box,
            createdAt: area.createdAt,
            updatedAt: area.updatedAt,
            deletedAt: area.deletedAt,
            storages: area.strs.map((storage) => ({
              id: storage.id,
              name: storage.name,
              description: storage.description,
              type: storage.type,
              capacity: storage.capacity,
              currentOccupancy: storage.currentOccupancy,
              variant: storage.variant,
              boundingBox: storage.bounding_box,
              createdAt: storage.createdAt,
              updatedAt: storage.updatedAt,
              deletedAt: storage.deletedAt,
              spaces: storage.invs.map((space) => ({
                id: space.id,
                name: space.name,
                barcode: space.barcode,
                dimensions: space.dimensions,
                productCapacity: space.productCapacity,
                createdAt: space.createdAt,
                updatedAt: space.updatedAt,
                deletedAt: space.deletedAt,
                products: space.products.map((p) => ({
                  id: p.product.id,
                  name: p.product.name,
                  sku: p.product.sku,
                  barcode: p.product.barcode,
                  createdAt: p.product.createdAt,
                  updatedAt: p.product.updatedAt,
                  deletedAt: p.product.deletedAt,
                  stock: space.products.filter((p2) => p2.product.id === p.product.id).length,
                  minStock: p.product.minimumStock,
                  maxStock: p.product.maximumStock,
                  reorderPoint: p.product.reorderPoint,
                  safetyStock: p.product.safetyStock,
                })),
              })),
            })),
          })),
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

    return {
      create,
      findById,
      findByUserId,
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
