import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, object, parse, safeParse, type InferInput } from "valibot";
import { BrandCreateSchema, BrandUpdateSchema, TB_brands } from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { BrandInvalidId, BrandNotCreated, BrandNotDeleted, BrandNotFound, BrandNotUpdated } from "./errors";

export class BrandService extends Effect.Service<BrandService>()("@warehouse/brands", {
  effect: Effect.gen(function* (_) {
    const db = yield* DatabaseService;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_brands.findMany>[0]>;

    const create = Effect.fn("@warehouse/brands/create")(function* (userInput: InferInput<typeof BrandCreateSchema>) {
      const [brand] = yield* db.insert(TB_brands).values(userInput).returning();
      if (!brand) {
        return yield* Effect.fail(new BrandNotCreated({}));
      }

      return brand;
    });

    const findById = Effect.fn("@warehouse/brands/findById")(function* (
      id: string,
      relations?: FindManyParams["with"],
    ) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new BrandInvalidId({ id }));
      }

      const brand = yield* db.query.TB_brands.findFirst({
        where: (brands, operations) => operations.eq(brands.id, parsedId.output),
        with: relations,
      });

      if (!brand) {
        return yield* Effect.fail(new BrandNotFound({ id }));
      }

      return brand;
    });

    const update = Effect.fn("@warehouse/brands/update")(function* (input: InferInput<typeof BrandUpdateSchema>) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new BrandInvalidId({ id: input.id }));
      }

      const [updated] = yield* db
        .update(TB_brands)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(TB_brands.id, parsedId.output))
        .returning();

      if (!updated) {
        return yield* Effect.fail(new BrandNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const remove = Effect.fn("@warehouse/brands/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new BrandInvalidId({ id }));
      }

      const [deleted] = yield* db.delete(TB_brands).where(eq(TB_brands.id, parsedId.output)).returning();

      if (!deleted) {
        return yield* Effect.fail(new BrandNotDeleted({ id }));
      }

      return deleted;
    });

    const safeRemove = Effect.fn("@warehouse/brands/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new BrandInvalidId({ id }));
      }

      const entries = yield* db
        .update(TB_brands)
        .set({ deletedAt: new Date() })
        .where(eq(TB_brands.id, parsedId.output))
        .returning();

      if (entries.length === 0) {
        return yield* Effect.fail(new BrandNotCreated({ message: "Failed to safe remove brand" }));
      }

      return entries[0];
    });

    const all = Effect.fn("@warehouse/brands/all")(function* () {
      return yield* db.query.TB_brands.findMany();
    });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      all,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const BrandLive = BrandService.Default;

// Type exports
export type BrandInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<BrandService["findById"]>>>>;
