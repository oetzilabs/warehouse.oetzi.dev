import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, object, parse, safeParse, type InferInput } from "valibot";
import labels from "../../data/product_labels.json";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { ProductLabelCreateSchema, ProductLabelUpdateSchema, TB_product_labels } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import {
  ProductLabelInvalidId,
  ProductLabelNotCreated,
  ProductLabelNotDeleted,
  ProductLabelNotFound,
  ProductLabelNotUpdated,
} from "./errors";

export class ProductLabelsService extends Effect.Service<ProductLabelsService>()("@warehouse/product-labels", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const create = (input: { name: string; description?: string | null }) =>
      Effect.gen(function* (_) {
        const [label] = yield* Effect.promise(() =>
          db.insert(TB_product_labels).values({ name: input.name, description: input.description }).returning(),
        );
        if (!label) {
          return yield* Effect.fail(new ProductLabelNotCreated({}));
        }
        return findById(label.id);
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new ProductLabelInvalidId({ id }));
        }

        const label = yield* Effect.promise(() =>
          db.query.TB_product_labels.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: {
              products: {
                with: {
                  product: true,
                },
              },
            },
          }),
        );

        if (!label) {
          return yield* Effect.fail(new ProductLabelNotFound({ id }));
        }

        return label;
      });

    const update = (id: string, input: InferInput<typeof ProductLabelUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new ProductLabelInvalidId({ id }));
        }

        const [label] = yield* Effect.promise(() =>
          db
            .update(TB_product_labels)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_product_labels.id, parsedId.output))
            .returning(),
        );

        if (!label) {
          return yield* Effect.fail(new ProductLabelNotUpdated({ id }));
        }

        return label;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new ProductLabelInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_product_labels).where(eq(TB_product_labels.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new ProductLabelNotDeleted({ id }));
        }

        return deleted;
      });

    const findAll = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() =>
          db.query.TB_product_labels.findMany({
            with: {
              products: {
                with: {
                  product: true,
                },
              },
            },
          }),
        );
      });

    const seed = () =>
      Effect.gen(function* (_) {
        const dbLabels = yield* findAllWithoutProducts();

        const lbs = parse(
          array(
            object({
              ...ProductLabelCreateSchema.entries,
              id: prefixed_cuid2,
            }),
          ),
          labels,
        );
        const existing = dbLabels.map((u) => u.id);

        const toCreate = lbs.filter((t) => !existing.includes(t.id));

        if (toCreate.length > 0) {
          yield* Effect.promise(() => db.insert(TB_product_labels).values(toCreate).returning());
          yield* Effect.log("Created product labels", toCreate);
        }

        const toUpdate = lbs.filter((t) => existing.includes(t.id));
        if (toUpdate.length > 0) {
          for (const label of toUpdate) {
            yield* Effect.promise(() =>
              db
                .update(TB_product_labels)
                .set({ ...label, updatedAt: new Date() })
                .where(eq(TB_product_labels.id, label.id))
                .returning(),
            );
          }
        }

        return lbs;
      });

    const findAllWithoutProducts = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_product_labels.findMany());
      });

    return { create, findById, update, remove, findAll, findAllWithoutProducts, seed } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const ProductLabelsLive = ProductLabelsService.Default;

// Type exports
export type ProductLabelInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<ProductLabelsService["findById"]>>>
>;
export type ProductLabelWithoutProductInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<ProductLabelsService["findAllWithoutProducts"]>>>
>;
