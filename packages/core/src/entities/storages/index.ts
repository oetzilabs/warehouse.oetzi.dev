import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { StorageCreateSchema, StorageUpdateSchema, TB_storages } from "../../drizzle/sql/schema";
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
      secs: {
        with: {
          spaces: {
            with: {
              prs: {
                with: {
                  pr: true,
                },
              },
              labels: true,
            },
          },
        },
      },
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

    return { create, findById, update, remove, safeRemove, findByAreaId } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const StorageLive = StorageService.Default;
export type StorageInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<StorageService["findById"]>>>>;
