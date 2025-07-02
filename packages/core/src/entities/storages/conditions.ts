import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import {
  StorageConditionCreateSchema,
  StorageConditionUpdateSchema,
  TB_products_to_storage_conditions,
  TB_storage_conditions,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { StorageInvalidId, StorageNotCreated, StorageNotDeleted, StorageNotFound, StorageNotUpdated } from "./errors";

export class StorageConditionService extends Effect.Service<StorageConditionService>()(
  "@warehouse/storage-conditions",
  {
    effect: Effect.gen(function* (_) {
      const db = yield* DatabaseService;

      const create = (input: InferInput<typeof StorageConditionCreateSchema>) =>
        Effect.gen(function* (_) {
          const [condition] = yield* db.insert(TB_storage_conditions).values(input).returning();
          if (!condition) {
            return yield* Effect.fail(new StorageNotCreated());
          }
          return findById(condition.id);
        });

      const findById = (id: string) =>
        Effect.gen(function* (_) {
          const parsedId = safeParse(prefixed_cuid2, id);
          if (!parsedId.success) {
            return yield* Effect.fail(new StorageInvalidId({ id }));
          }

          const condition = yield* db.query.TB_storage_conditions.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
          });

          if (!condition) {
            return yield* Effect.fail(new StorageNotFound({ id }));
          }

          return condition;
        });

      const findAll = () =>
        Effect.gen(function* (_) {
          return yield* db.query.TB_storage_conditions.findMany();
        });

      const update = (id: string, input: InferInput<typeof StorageConditionUpdateSchema>) =>
        Effect.gen(function* (_) {
          const parsedId = safeParse(prefixed_cuid2, id);
          if (!parsedId.success) {
            return yield* Effect.fail(new StorageInvalidId({ id }));
          }

          const [condition] = yield* db
            .update(TB_storage_conditions)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_storage_conditions.id, parsedId.output))
            .returning();

          if (!condition) {
            return yield* Effect.fail(new StorageNotUpdated({ id }));
          }

          return condition;
        });

      const remove = (id: string) =>
        Effect.gen(function* (_) {
          const parsedId = safeParse(prefixed_cuid2, id);
          if (!parsedId.success) {
            return yield* Effect.fail(new StorageInvalidId({ id }));
          }

          const [deleted] = yield* db
            .delete(TB_storage_conditions)
            .where(eq(TB_storage_conditions.id, parsedId.output))
            .returning();

          if (!deleted) {
            return yield* Effect.fail(new StorageNotDeleted({ id }));
          }

          return deleted;
        });

      const safeRemove = (id: string) =>
        Effect.gen(function* (_) {
          const parsedId = safeParse(prefixed_cuid2, id);
          if (!parsedId.success) return yield* Effect.fail(new StorageInvalidId({ id }));
          const [deleted] = yield* db
            .update(TB_storage_conditions)
            .set({ deletedAt: new Date() })
            .where(eq(TB_storage_conditions.id, parsedId.output))
            .returning();
          return deleted;
        });

      const assignToProduct = (productId: string, conditionId: string) =>
        Effect.gen(function* (_) {
          yield* db
            .insert(TB_products_to_storage_conditions)
            .values({
              productId,
              conditionId,
            })
            .returning();
        });

      const removeFromProduct = (productId: string, conditionId: string) =>
        Effect.gen(function* (_) {
          yield* db
            .delete(TB_products_to_storage_conditions)
            .where(
              and(
                eq(TB_products_to_storage_conditions.productId, productId),
                eq(TB_products_to_storage_conditions.conditionId, conditionId),
              ),
            )
            .returning();
        });

      return {
        create,
        findById,
        findAll,
        update,
        remove,
        safeRemove,
        assignToProduct,
        removeFromProduct,
      } as const;
    }),
    dependencies: [DatabaseLive],
  },
) {}

export const StorageConditionLive = StorageConditionService.Default;
export type StorageConditionInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<StorageConditionService["findById"]>>>
>;
