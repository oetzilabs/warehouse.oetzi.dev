import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import { TB_warehouse_types, WarehouseTypeCreateSchema, WarehouseTypeUpdateSchema } from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";

export class WarehouseTypeService extends Effect.Service<WarehouseTypeService>()("@warehouse/warehouse-types", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const create = (data: InferInput<typeof WarehouseTypeCreateSchema>) =>
      Effect.gen(function* (_) {
        const [warehouseType] = yield* Effect.promise(() => db.insert(TB_warehouse_types).values(data).returning());
        return warehouseType;
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_warehouse_types.findMany());
      });

    const findById = (id: string) =>
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

    const update = (data: InferInput<typeof WarehouseTypeUpdateSchema>) =>
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

    const remove = (id: string) =>
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

    const seed = () =>
      Effect.gen(function* (_) {
        const versions = yield* Effect.promise(() => db.query.TB_warehouse_types.findMany());
        // compare and update if needed, otherwise create

        const warehouseTypes = [
          {
            id: `wht_x8ocjjtose3s6fzgu42wlw8v`, // premade ids
            name: "Retail",
            code: "RETAIL",
            description: "Retail warehouses are used for storing goods and products.",
          },
          {
            id: `wht_ul6fl08era8zwp4eytmumg26`, // premade ids
            name: "Warehouse",
            code: "WAREHOUSE",
            description: "Warehouses are used for storing goods and products.",
          },
        ];

        const existing = versions.map((v) => v.id);

        const toCreate = warehouseTypes.filter((t) => !existing.includes(t.id));

        if (toCreate.length > 0) {
          yield* Effect.promise(() => db.insert(TB_warehouse_types).values(toCreate).returning());
        }

        const toUpdate = warehouseTypes.filter((t) => existing.includes(t.id));
        if (toUpdate.length > 0) {
          for (const warehouseType of toUpdate) {
            yield* Effect.promise(() =>
              db
                .update(TB_warehouse_types)
                .set({ ...warehouseType, updatedAt: new Date() })
                .where(eq(TB_warehouse_types.id, warehouseType.id))
                .returning(),
            );
          }
        }

        return warehouseTypes;
      });

    return {
      create,
      all,
      findById,
      update,
      remove,
      seed,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const WarehouseTypeLive = WarehouseTypeService.Default;

// Type exports
export type Frontend = NonNullable<Awaited<ReturnType<WarehouseTypeService["findById"]>>>;
