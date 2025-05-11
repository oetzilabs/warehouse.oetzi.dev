import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../drizzle/sql";
import { ProductCreateSchema, ProductUpdateSchema, TB_products } from "../drizzle/sql/schema";
import { prefixed_cuid2 } from "../utils/custom-cuid2-valibot";

export class ProductService extends Effect.Service<ProductService>()("@warehouse/products", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;
    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_products.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => ({
      saleItems: {
        with: {
          sale: {
            with: {
              customer: true,
            },
          },
        },
      },
    });

    const create = (input: InferInput<typeof ProductCreateSchema>) =>
      Effect.gen(function* (_) {
        const [product] = yield* Effect.promise(() => db.insert(TB_products).values(input).returning());
        return findById(product.id);
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const rels = relations ?? withRelations();
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) return yield* Effect.fail(new Error("Invalid product ID"));
        return yield* Effect.promise(() =>
          db.query.TB_products.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: rels,
          }),
        );
      });

    const update = (id: string, input: InferInput<typeof ProductUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) return yield* Effect.fail(new Error("Invalid product ID"));
        const [product] = yield* Effect.promise(() =>
          db
            .update(TB_products)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_products.id, parsedId.output))
            .returning(),
        );
        return product;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) return yield* Effect.fail(new Error("Invalid product ID"));
        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_products).where(eq(TB_products.id, parsedId.output)).returning(),
        );
        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) return yield* Effect.fail(new Error("Invalid product ID"));
        const [deleted] = yield* Effect.promise(() =>
          db.update(TB_products).set({ deletedAt: new Date() }).where(eq(TB_products.id, parsedId.output)).returning(),
        );
        return deleted;
      });

    return { create, findById, update, remove, safeRemove } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const ProductLive = ProductService.Default;
