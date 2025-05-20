import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, object, parse, safeParse, type InferInput } from "valibot";
import storages from "../../data/storages.json";
import warehouseAreas from "../../data/warehouse_areas.json";
import facilites from "../../data/warehouse_facilities.json";
import warehouseProducts from "../../data/warehouse_products.json";
import warehouses from "../../data/warehouses.json";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  FacilityCreateSchema,
  FacilityUpdateSchema,
  StorageCreateSchema,
  StorageUpdateSchema,
  TB_organizations_warehouses,
  TB_users_warehouses,
  TB_warehouse_areas,
  TB_warehouse_facilities,
  TB_warehouse_products,
  TB_warehouse_types,
  TB_warehouses,
  WarehouseAreaCreateSchema,
  WarehouseAreaUpdateSchema,
  WarehouseCreateSchema,
  WarehouseTypeCreateSchema,
  WarehouseTypeUpdateSchema,
  WarehouseUpdateSchema,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { FacilityNotFound } from "../facilities/errors";
import {
  WarehouseInvalidId,
  WarehouseNotCreated,
  WarehouseNotDeleted,
  WarehouseNotFound,
  WarehouseNotFoundForOrganization,
  WarehouseNotUpdated,
  WarehouseOrganizationInvalidId,
  WarehouseOrganizationLinkFailed,
  WarehouseOrganizationUnlinkFailed,
  WarehouseUserInvalidId,
  WarehouseUserLinkFailed,
} from "./errors";

export class WarehouseService extends Effect.Service<WarehouseService>()("@warehouse/warehouses", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_warehouses.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        addresses: {
          with: {
            address: true,
          },
        },
        owner: {
          columns: {
            hashed_password: false,
          },
        },
        fcs: {
          with: {
            ars: {
              with: {
                strs: {
                  with: {
                    type: true,
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
        },
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (userInput: InferInput<typeof WarehouseCreateSchema>, organizationId: string, userId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new WarehouseOrganizationInvalidId({ organizationId }));
        }
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new WarehouseUserInvalidId({ userId }));
        }

        const [warehouse] = yield* Effect.promise(() => db.insert(TB_warehouses).values(userInput).returning());
        if (!warehouse) {
          return yield* Effect.fail(new WarehouseNotCreated({}));
        }

        const connectedToOrg = yield* Effect.promise(() =>
          db
            .insert(TB_organizations_warehouses)
            .values({
              organizationId: parsedOrgId.output,
              warehouseId: warehouse.id,
            })
            .returning(),
        );

        if (!connectedToOrg) {
          return yield* Effect.fail(
            new WarehouseOrganizationLinkFailed({ organizationId: parsedOrgId.output, warehouseId: warehouse.id }),
          );
        }

        const connectedToUser = yield* Effect.promise(() =>
          db
            .insert(TB_users_warehouses)
            .values({
              userId: parsedUserId.output,
              warehouseId: warehouse.id,
            })
            .returning(),
        );

        if (!connectedToUser) {
          return yield* Effect.fail(
            new WarehouseUserLinkFailed({ userId: parsedUserId.output, warehouseId: warehouse.id }),
          );
        }

        return warehouse;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id }));
        }

        const warehouse = yield* Effect.promise(() =>
          db.query.TB_warehouses.findFirst({
            where: (warehouses, operations) => operations.eq(warehouses.id, parsedId.output),
            with: {
              addresses: {
                with: {
                  address: true,
                },
              },
              owner: {
                columns: {
                  hashed_password: false,
                },
              },
              fcs: {
                with: {
                  ars: {
                    with: {
                      strs: {
                        with: {
                          type: true,
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
              },
            },
          }),
        );

        if (!warehouse) {
          return yield* Effect.fail(new WarehouseNotFound({ id }));
        }

        return warehouse;
      });

    const update = (input: InferInput<typeof WarehouseUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_warehouses)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_warehouses.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new WarehouseNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id }));
        }

        const entries = yield* Effect.promise(() =>
          db.query.TB_organizations_warehouses.findMany({
            where: (fields, operations) => operations.eq(fields.warehouseId, parsedId.output),
            with: {
              organization: true,
            },
          }),
        );

        if (entries.length > 0) {
          // remove the warehouse from the associated organizations
          yield* Effect.promise(() =>
            db
              .delete(TB_organizations_warehouses)
              .where(eq(TB_organizations_warehouses.warehouseId, parsedId.output))
              .returning(),
          );
        }

        // remove the warehouse itself
        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_warehouses).where(eq(TB_warehouses.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new WarehouseNotDeleted({ id }));
        }

        return deleted;
      });

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new WarehouseOrganizationInvalidId({ organizationId }));
        }

        const entries = yield* Effect.promise(() =>
          db.query.TB_organizations_warehouses.findMany({
            where: (fields, operations) => operations.eq(fields.organizationId, parsedOrgId.output),
            with: {
              warehouse: true,
            },
          }),
        );

        if (entries.length === 0) {
          return yield* Effect.fail(new WarehouseNotFoundForOrganization({ organizationId }));
        }

        return entries.map((entry) => entry.warehouse);
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id }));
        }

        const entries = yield* Effect.promise(() =>
          db
            .update(TB_warehouses)
            .set({ deletedAt: new Date() })
            .where(eq(TB_warehouses.id, parsedId.output))
            .returning(),
        );

        if (entries.length === 0) {
          return yield* Effect.fail(new WarehouseNotCreated({ message: "Failed to safe remove warehouse" }));
        }

        return entries[0];
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_warehouses.findMany());
      });

    const findByUserId = (userId: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new WarehouseUserInvalidId({ userId }));
        }

        const entries = yield* Effect.promise(() =>
          db.query.TB_users_warehouses.findMany({
            where: (fields, operations) => operations.eq(fields.userId, parsedUserId.output),
            with: {
              warehouse: {
                with: relations,
              },
            },
          }),
        );

        return entries.map((entry) => entry.warehouse);
      });

    const findAreaById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id }));
        }
        const area = yield* Effect.promise(() =>
          db.query.TB_warehouse_areas.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
          }),
        );
        if (!area) {
          return yield* Effect.fail(new WarehouseNotFound({ id }));
        }
        return area;
      });

    const seed = () =>
      Effect.gen(function* (_) {
        const dbWarehouses = yield* Effect.promise(() => db.query.TB_warehouses.findMany());

        const whs = parse(
          array(
            object({
              ...WarehouseCreateSchema.entries,
              id: prefixed_cuid2,
            }),
          ),
          warehouses,
        );

        const existing = dbWarehouses.map((u) => u.id);

        const toCreate = whs.filter((t) => !existing.includes(t.id));

        if (toCreate.length > 0) {
          yield* Effect.promise(() => db.insert(TB_warehouses).values(toCreate).returning());
          yield* Effect.log("Created warehouses", toCreate);
        }

        const toUpdate = whs.filter((t) => existing.includes(t.id));
        if (toUpdate.length > 0) {
          for (const area of toUpdate) {
            yield* Effect.promise(() =>
              db
                .update(TB_warehouses)
                .set({ ...area, updatedAt: new Date() })
                .where(eq(TB_warehouses.id, area.id))
                .returning(),
            );
          }
        }

        // facilities

        const dbFacilities = yield* Effect.promise(() => db.query.TB_warehouse_facilities.findMany());
        const existingFacilities = dbFacilities.map((u) => u.id);

        const facilities = parse(
          array(
            object({
              ...FacilityCreateSchema.entries,
              id: prefixed_cuid2,
            }),
          ),
          facilites,
        );

        const toCreateFacilities = facilities.filter((t) => !existingFacilities.includes(t.id));

        if (toCreateFacilities.length > 0) {
          yield* Effect.promise(() => db.insert(TB_warehouse_facilities).values(toCreateFacilities).returning());
          yield* Effect.log("Created warehouse facilities", toCreateFacilities);
        }

        const toUpdateFacilities = facilities.filter((t) => existingFacilities.includes(t.id));
        if (toUpdateFacilities.length > 0) {
          for (const facility of toUpdateFacilities) {
            yield* Effect.promise(() =>
              db
                .update(TB_warehouse_facilities)
                .set({ ...facility, updatedAt: new Date() })
                .where(eq(TB_warehouse_facilities.id, facility.id))
                .returning(),
            );
          }
        }

        const dbAreas = yield* Effect.promise(() => db.query.TB_warehouse_areas.findMany());
        const existingAreas = dbAreas.map((u) => u.id);

        const areas = parse(
          array(
            object({
              ...WarehouseAreaCreateSchema.entries,
              id: prefixed_cuid2,
            }),
          ),
          warehouseAreas,
        );

        const toCreateAreas = areas.filter((t) => !existingAreas.includes(t.id));

        if (toCreateAreas.length > 0) {
          yield* Effect.promise(() => db.insert(TB_warehouse_areas).values(toCreateAreas).returning());
          yield* Effect.log("Created warehouse areas", toCreateAreas);
        }

        const toUpdateAreas = areas.filter((t) => existingAreas.includes(t.id));
        if (toUpdateAreas.length > 0) {
          for (const area of toUpdateAreas) {
            yield* Effect.promise(() =>
              db
                .update(TB_warehouse_areas)
                .set({ ...area, updatedAt: new Date() })
                .where(eq(TB_warehouse_areas.id, area.id))
                .returning(),
            );
          }
        }

        // Seed warehouse products
        const dbWarehouseProducts = yield* Effect.promise(() => db.query.TB_warehouse_products.findMany());

        const whProducts = parse(
          array(
            object({
              warehouseId: prefixed_cuid2,
              productId: prefixed_cuid2,
            }),
          ),
          warehouseProducts,
        );

        const existingWhProducts = dbWarehouseProducts.map((wp) => `${wp.warehouseId}-${wp.productId}`);

        const toCreateWhProducts = whProducts.filter(
          (wp) => !existingWhProducts.includes(`${wp.warehouseId}-${wp.productId}`),
        );

        if (toCreateWhProducts.length > 0) {
          yield* Effect.promise(() => db.insert(TB_warehouse_products).values(toCreateWhProducts).returning());
          yield* Effect.log("Created warehouse-product relationships", toCreateWhProducts);
        }

        return whs;
      });

    const findLastCreatedFacility = (warehouseId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, warehouseId);
        if (!parsedId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id: warehouseId }));
        }

        const f = yield* Effect.promise(() =>
          db.query.TB_warehouse_facilities.findFirst({
            where: (fields, operations) => operations.eq(fields.ownerId, parsedId.output),
            orderBy: (fields, operations) => [operations.desc(fields.createdAt)],
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
        if (!f) {
          return yield* Effect.fail(new FacilityNotFound({ id: parsedId.output }));
        }

        return f;
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByOrganizationId,
      all,
      findByUserId,
      findAreaById,
      seed,
      findLastCreatedFacility,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const WarehouseLive = WarehouseService.Default;

// Type exports
export type WarehouseInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<WarehouseService["findById"]>>>>;
