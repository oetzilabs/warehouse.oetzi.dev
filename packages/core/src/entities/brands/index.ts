import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, object, parse, safeParse, type InferInput } from "valibot";
import brands from "../../data/brands.json";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { BrandCreateSchema, BrandUpdateSchema, TB_brands } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { BrandInvalidId, BrandNotCreated, BrandNotDeleted, BrandNotFound, BrandNotUpdated } from "./errors";

export class BrandService extends Effect.Service<BrandService>()("@warehouse/brands", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_brands.findMany>[0]>;

    const create = (userInput: InferInput<typeof BrandCreateSchema>) =>
      Effect.gen(function* (_) {
        const [brand] = yield* Effect.promise(() => db.insert(TB_brands).values(userInput).returning());
        if (!brand) {
          return yield* Effect.fail(new BrandNotCreated({}));
        }

        return brand;
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new BrandInvalidId({ id }));
        }

        const brand = yield* Effect.promise(() =>
          db.query.TB_brands.findFirst({
            where: (brands, operations) => operations.eq(brands.id, parsedId.output),
            with: relations,
          }),
        );

        if (!brand) {
          return yield* Effect.fail(new BrandNotFound({ id }));
        }

        return brand;
      });

    const update = (input: InferInput<typeof BrandUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new BrandInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_brands)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_brands.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new BrandNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new BrandInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_brands).where(eq(TB_brands.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new BrandNotDeleted({ id }));
        }

        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new BrandInvalidId({ id }));
        }

        const entries = yield* Effect.promise(() =>
          db.update(TB_brands).set({ deletedAt: new Date() }).where(eq(TB_brands.id, parsedId.output)).returning(),
        );

        if (entries.length === 0) {
          return yield* Effect.fail(new BrandNotCreated({ message: "Failed to safe remove brand" }));
        }

        return entries[0];
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_brands.findMany());
      });

    const seed = () =>
      Effect.gen(function* (_) {
        const dbBrands = yield* Effect.promise(() => db.query.TB_brands.findMany());

        const brds = parse(
          array(
            object({
              ...BrandCreateSchema.entries,
              id: prefixed_cuid2,
            }),
          ),
          brands,
        );

        const existing = dbBrands.map((b) => b.id);
        const toCreate = brds.filter((b) => !existing.includes(b.id));

        if (toCreate.length > 0) {
          yield* Effect.promise(() => db.insert(TB_brands).values(toCreate).returning());
          yield* Effect.log("Created brands", toCreate);
        }

        const toUpdate = brds.filter((b) => existing.includes(b.id));
        if (toUpdate.length > 0) {
          for (const brand of toUpdate) {
            yield* Effect.promise(() =>
              db
                .update(TB_brands)
                .set({ ...brand, updatedAt: new Date() })
                .where(eq(TB_brands.id, brand.id))
                .returning(),
            );
          }
        }

        return brds;
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      all,
      seed,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const BrandLive = BrandService.Default;

// Type exports
export type BrandInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<BrandService["findById"]>>>>;
