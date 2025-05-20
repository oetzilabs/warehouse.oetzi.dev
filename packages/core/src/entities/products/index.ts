import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { array, InferInput, object, parse, safeParse } from "valibot";
import products from "../../data/products.json";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  ProductCreateSchema,
  ProductCreateWithDateTransformSchema,
  ProductUpdateSchema,
  TB_products,
  TB_products_to_labels,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { WarehouseInvalidId } from "../warehouses/errors";
import {
  ProductInvalidId,
  ProductInvalidJson,
  ProductLabelAlreadyExists,
  ProductLabelInvalidId,
  ProductLabelNotAdded,
  ProductLabelNotFound,
  ProductNotCreated,
  ProductNotDeleted,
  ProductNotFound,
  ProductNotUpdated,
} from "./errors";

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
      orders: {
        with: {
          order: true,
        },
      },
      labels: {
        with: {
          label: true,
        },
      },
      stco: {
        with: {
          condition: true,
        },
      },
    });

    const create = (input: InferInput<typeof ProductCreateSchema>) =>
      Effect.gen(function* (_) {
        const [product] = yield* Effect.promise(() => db.insert(TB_products).values(input).returning());
        if (!product) {
          return yield* Effect.fail(new ProductNotCreated({}));
        }
        return findById(product.id);
      });

    const findById = (id: string, relations?: FindManyParams["with"]) =>
      Effect.gen(function* (_) {
        const rels = relations ?? withRelations();
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id }));
        }

        const product = yield* Effect.promise(() =>
          db.query.TB_products.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: {
              saleItems: {
                with: {
                  sale: {
                    with: {
                      customer: true,
                    },
                  },
                },
              },
              orders: {
                with: {
                  order: true,
                },
              },
              labels: {
                with: {
                  label: true,
                },
              },
              stco: {
                with: {
                  condition: true,
                },
              },
            },
          }),
        );

        if (!product) {
          return yield* Effect.fail(new ProductNotFound({ id }));
        }

        return product;
      });

    const update = (id: string, input: InferInput<typeof ProductUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id }));
        }

        const [product] = yield* Effect.promise(() =>
          db
            .update(TB_products)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_products.id, parsedId.output))
            .returning(),
        );

        if (!product) {
          return yield* Effect.fail(new ProductNotUpdated({ id }));
        }

        return product;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_products).where(eq(TB_products.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new ProductNotDeleted({ id }));
        }

        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) return yield* Effect.fail(new ProductInvalidId({ id }));
        const [deleted] = yield* Effect.promise(() =>
          db.update(TB_products).set({ deletedAt: new Date() }).where(eq(TB_products.id, parsedId.output)).returning(),
        );
        return deleted;
      });

    const findByWarehouseId = (warehouseId: string) =>
      Effect.gen(function* (_) {
        const parsedWarehouseId = safeParse(prefixed_cuid2, warehouseId);
        if (!parsedWarehouseId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id: warehouseId }));
        }
        return yield* Effect.promise(() =>
          db.query.TB_warehouse_products.findMany({
            where: (fields, operations) => operations.eq(fields.warehouseId, parsedWarehouseId.output),
            with: {
              product: {
                with: {
                  saleItems: {
                    with: {
                      sale: {
                        with: {
                          customer: true,
                        },
                      },
                    },
                  },
                  orders: {
                    with: {
                      order: true,
                    },
                  },
                  labels: {
                    with: {
                      label: true,
                    },
                  },
                  stco: {
                    with: {
                      condition: true,
                    },
                  },
                },
              },
            },
          }),
        );
      });

    const addLabel = (productId: string, labelId: string) =>
      Effect.gen(function* (_) {
        const parsedProductId = safeParse(prefixed_cuid2, productId);
        if (!parsedProductId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: productId }));
        }

        const parsedLabelId = safeParse(prefixed_cuid2, labelId);
        if (!parsedLabelId.success) {
          return yield* Effect.fail(new ProductLabelInvalidId({ id: labelId }));
        }

        const product = yield* Effect.promise(() =>
          db.query.TB_products.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedProductId.output),
            with: {
              labels: {
                with: {
                  label: true,
                },
              },
            },
          }),
        );

        if (!product) {
          return yield* Effect.fail(new ProductNotFound({ id: productId }));
        }

        const label = yield* Effect.promise(() =>
          db.query.TB_product_labels.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedLabelId.output),
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
          return yield* Effect.fail(new ProductLabelNotFound({ id: labelId }));
        }

        if (product.labels.some((l) => l.label.id === label.id)) {
          return yield* Effect.fail(new ProductLabelAlreadyExists({ id: labelId }));
        }

        const added = yield* Effect.promise(() =>
          db
            .insert(TB_products_to_labels)
            .values({ productId: parsedProductId.output, labelId: parsedLabelId.output })
            .returning(),
        );

        if (!added) {
          return yield* Effect.fail(new ProductLabelNotAdded());
        }

        return added;
      });

    const removeLabel = (productId: string, labelId: string) =>
      Effect.gen(function* (_) {
        const parsedProductId = safeParse(prefixed_cuid2, productId);
        if (!parsedProductId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: productId }));
        }

        const parsedLabelId = safeParse(prefixed_cuid2, labelId);
        if (!parsedLabelId.success) {
          return yield* Effect.fail(new ProductLabelInvalidId({ id: labelId }));
        }

        const product = yield* Effect.promise(() =>
          db.query.TB_products.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedProductId.output),
            with: {
              labels: {
                with: {
                  label: true,
                },
              },
            },
          }),
        );

        if (!product) {
          return yield* Effect.fail(new ProductNotFound({ id: productId }));
        }

        const label = yield* Effect.promise(() =>
          db.query.TB_product_labels.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedLabelId.output),
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
          return yield* Effect.fail(new ProductLabelNotFound({ id: labelId }));
        }

        const removed = yield* Effect.promise(() =>
          db
            .delete(TB_products_to_labels)
            .where(eq(TB_products_to_labels.productId, parsedProductId.output))
            .returning(),
        );

        if (!removed) {
          return yield* Effect.fail(new ProductLabelNotAdded());
        }

        return removed;
      });

    const seed = () =>
      Effect.gen(function* (_) {
        const dbProducts = yield* Effect.promise(() => db.query.TB_products.findMany());

        const productsToSeedValid = safeParse(array(ProductCreateWithDateTransformSchema), products);
        if (!productsToSeedValid.success) {
          return yield* Effect.fail(new ProductInvalidJson({ json: products, issues: productsToSeedValid.issues }));
        }

        const productsToSeed = productsToSeedValid.output;

        const existing = dbProducts.map((v) => v.id);
        const toCreate = productsToSeed.filter((t) => !existing.includes(t.id));

        if (toCreate.length > 0) {
          const created = yield* Effect.promise(() => db.insert(TB_products).values(toCreate).returning());
          yield* Effect.log("Created products", created);
        }

        const toUpdate = productsToSeed.filter((t) => existing.includes(t.id));
        if (toUpdate.length > 0) {
          for (const product of toUpdate) {
            const updated = yield* Effect.promise(() =>
              db
                .update(TB_products)
                .set({ ...product, updatedAt: new Date() })
                .where(eq(TB_products.id, product.id))
                .returning(),
            );
            yield* Effect.log("Updated product", updated);
          }
        }

        return productsToSeed;
      });

    return { create, findById, update, remove, safeRemove, findByWarehouseId, addLabel, removeLabel, seed } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const ProductLive = ProductService.Default;

// Type exports
export type ProductInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<ProductService["findById"]>>>>;
