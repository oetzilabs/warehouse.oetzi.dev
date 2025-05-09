import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, object, parse, safeParse, type InferInput } from "valibot";
import warehouses from "../data/warehouses.json";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import {
  TB_organizations_warehouses,
  TB_users_warehouses,
  TB_warehouse_areas,
  TB_warehouse_types,
  TB_warehouses,
  WarehouseAreaCreateSchema,
  WarehouseAreaUpdateSchema,
  WarehouseCreateSchema,
  WarehouseTypeCreateSchema,
  WarehouseTypeUpdateSchema,
  WarehouseUpdateSchema,
} from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";

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
        storages: {
          with: {
            storage: {
              with: {
                type: true,
              },
            },
          },
        },
        owner: {
          columns: {
            hashed_password: false,
          },
        },
        areas: true,
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
          return yield* Effect.fail(new Error("Invalid organization ID format"));
        }
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new Error("Invalid organization ID format"));
        }

        const [warehouse] = yield* Effect.promise(() => db.insert(TB_warehouses).values(userInput).returning());

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
          return yield* Effect.fail(new Error("Failed to connect warehouse to organization"));
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
          return yield* Effect.fail(new Error("Failed to connect warehouse to user"));
        }

        return warehouse;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid warehouse ID format"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_warehouses.findFirst({
            where: (warehouses, operations) => operations.eq(warehouses.id, parsedId.output),
            with: relations,
          }),
        );
      });

    const update = (input: InferInput<typeof WarehouseUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid warehouse ID"));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_warehouses)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_warehouses.id, parsedId.output))
            .returning(),
        );
        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid warehouse ID"));
        }

        return yield* Effect.promise(() =>
          db
            .delete(TB_warehouses)
            .where(eq(TB_warehouses.id, parsedId.output))
            .returning()
            .then(([x]) => x),
        );
      });

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new Error("Invalid organization ID"));
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
          return yield* Effect.fail(new Error("No warehouses found for organization"));
        }

        return entries.map((entry) => entry.warehouse);
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid warehouse ID"));
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
          return yield* Effect.fail(new Error("Warehouse is still associated with organizations"));
        }

        const entries2 = yield* Effect.promise(() =>
          db
            .update(TB_warehouses)
            .set({ deletedAt: new Date() })
            .where(eq(TB_warehouses.id, parsedId.output))
            .returning(),
        );

        if (entries2.length === 0) {
          return yield* Effect.fail(new Error("Failed to remove warehouse"));
        }

        return entries2[0];
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_warehouses.findMany());
      });

    const findByUserId = (userId: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new Error("Invalid user ID"));
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

    const addArea = (data: InferInput<typeof WarehouseAreaCreateSchema>, warehouseId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, warehouseId);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid warehouse ID format"));
        }
        const wh = yield* Effect.promise(() =>
          db.query.TB_warehouses.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
          }),
        );
        if (!wh) {
          return yield* Effect.fail(new Error("Warehouse not found"));
        }
        const [area] = yield* Effect.promise(() => db.insert(TB_warehouse_areas).values(data).returning());

        return area;
      });

    const findAreaById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid warehouse ID format"));
        }
        const area = yield* Effect.promise(() =>
          db.query.TB_warehouse_areas.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
          }),
        );
        return area;
      });

    const updateArea = (data: InferInput<typeof WarehouseAreaUpdateSchema>, areaId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, areaId);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid warehouse ID format"));
        }
        const area = yield* Effect.promise(() =>
          db.query.TB_warehouse_areas.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
          }),
        );
        if (!area) {
          return yield* Effect.fail(new Error("Area not found"));
        }
        const [updatedArea] = yield* Effect.promise(() =>
          db
            .update(TB_warehouse_areas)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(TB_warehouse_areas.id, area.id))
            .returning(),
        );
        return updatedArea;
      });

    const seed = () =>
      Effect.gen(function* (_) {
        const dbAreas = yield* Effect.promise(() => db.query.TB_warehouse_areas.findMany());

        const as = parse(
          array(
            object({
              ...WarehouseCreateSchema.entries,
              id: prefixed_cuid2,
            }),
          ),
          warehouses,
        );

        const existing = dbAreas.map((u) => u.id);

        const toCreate = as.filter((t) => !existing.includes(t.id));

        if (toCreate.length > 0) {
          yield* Effect.promise(() => db.insert(TB_warehouses).values(toCreate).returning());
          yield* Effect.log("Created warehouses", toCreate);
        }

        const toUpdate = as.filter((t) => existing.includes(t.id));
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

        return as;
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByOrganizationId,
      all,
      addArea,
      findByUserId,
      findAreaById,
      updateArea,
      seed,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const WarehouseLive = WarehouseService.Default;

// Type exports
export type WarehouseInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<WarehouseService["findById"]>>>>;
