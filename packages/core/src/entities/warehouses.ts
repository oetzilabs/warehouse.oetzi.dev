import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import {
  TB_organizations_warehouses,
  TB_warehouse_types,
  TB_warehouses,
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
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (userInput: InferInput<typeof WarehouseCreateSchema>, organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new Error("Invalid organization ID format"));
        }

        const [warehouse] = yield* Effect.promise(() => db.insert(TB_warehouses).values(userInput).returning());
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

    const addType = (data: InferInput<typeof WarehouseTypeCreateSchema>) =>
      Effect.gen(function* (_) {
        const [warehouse] = yield* Effect.promise(() => db.insert(TB_warehouse_types).values(data).returning());
        return warehouse;
      });

    const listTypes = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_warehouse_types.findMany());
      });

    const findTypeById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid warehouse type ID"));
        }

        return yield* Effect.promise(() =>
          db.query.TB_warehouse_types.findFirst({
            where: (warehouse_types, operations) => operations.eq(warehouse_types.id, parsedId.output),
          }),
        );
      });

    const updateType = (data: InferInput<typeof WarehouseTypeUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, data.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid warehouse type ID"));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_warehouse_types)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(TB_warehouse_types.id, parsedId.output))
            .returning(),
        );
        return updated;
      });

    const removeType = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new Error("Invalid warehouse type ID"));
        }

        return yield* Effect.promise(() =>
          db
            .delete(TB_warehouse_types)
            .where(eq(TB_warehouse_types.id, parsedId.output))
            .returning()
            .then(([x]) => x),
        );
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_warehouses.findMany());
      });

    const allTypes = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_warehouse_types.findMany());
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByOrganizationId,
      addType,
      listTypes,
      findTypeById,
      updateType,
      removeType,
      all,
      allTypes,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const WarehouseLive = WarehouseService.Default;

// Type exports
export type Frontend = NonNullable<Awaited<ReturnType<WarehouseService["findById"]>>>;
