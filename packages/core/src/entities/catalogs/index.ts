import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { CatalogCreateSchema, CatalogUpdateSchema, TB_catalog_products, TB_catalogs } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { ProductInvalidId, ProductNotFound } from "../products/errors";
import {
  CatalogInvalidId,
  CatalogNotCreated,
  CatalogNotDeleted,
  CatalogNotFound,
  CatalogNotUpdated,
  CatalogOrganizationInvalidId,
  CatalogProductAlreadyExists,
  CatalogProductNotFound,
} from "./errors";

export class CatalogService extends Effect.Service<CatalogService>()("@warehouse/catalogs", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_catalogs.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        organization: true,
        products: {
          with: {
            product: {
              with: {
                labels: true,
                suppliers: {
                  with: {
                    supplier: true,
                  },
                },
                brands: true,
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

    const create = (input: InferInput<typeof CatalogCreateSchema>, organizationId: string, userId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new CatalogOrganizationInvalidId({ organizationId: organizationId }));
        }

        const [catalog] = yield* Effect.promise(() =>
          db
            .insert(TB_catalogs)
            .values({ ...input, ownerId: userId, organizationId: parsedOrgId.output })
            .returning(),
        );

        if (!catalog) {
          return yield* Effect.fail(new CatalogNotCreated());
        }

        return catalog;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new CatalogInvalidId({ id }));
        }

        const catalog = yield* Effect.promise(() =>
          db.query.TB_catalogs.findFirst({
            where: (catalogs, operations) => operations.eq(catalogs.id, parsedId.output),
            with: {
              products: {
                with: {
                  product: true,
                },
              },
            },
          }),
        );

        if (!catalog) {
          return yield* Effect.fail(new CatalogNotFound({ id }));
        }

        return catalog;
      });

    const update = (input: InferInput<typeof CatalogUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new CatalogInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_catalogs)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_catalogs.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new CatalogNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new CatalogInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_catalogs).where(eq(TB_catalogs.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new CatalogNotDeleted({ id }));
        }

        return deleted;
      });

    const addProduct = (catalogId: string, productId: string, discount: number = 0) =>
      Effect.gen(function* (_) {
        const parsedCatalogId = safeParse(prefixed_cuid2, catalogId);
        if (!parsedCatalogId.success) {
          return yield* Effect.fail(new CatalogInvalidId({ id: catalogId }));
        }

        const parsedProductId = safeParse(prefixed_cuid2, productId);
        if (!parsedProductId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: productId }));
        }

        const exists = yield* Effect.promise(() =>
          db.query.TB_catalog_products.findFirst({
            where: (fields, operations) =>
              and(eq(fields.catalogId, parsedCatalogId.output), eq(fields.productId, parsedProductId.output)),
          }),
        );

        if (exists) {
          return yield* Effect.fail(
            new CatalogProductAlreadyExists({
              catalogId: parsedCatalogId.output,
              productId: parsedProductId.output,
            }),
          );
        }

        const [entry] = yield* Effect.promise(() =>
          db
            .insert(TB_catalog_products)
            .values({
              catalogId: parsedCatalogId.output,
              productId: parsedProductId.output,
              discount,
            })
            .returning(),
        );

        return entry;
      });

    const removeProduct = (catalogId: string, productId: string) =>
      Effect.gen(function* (_) {
        const parsedCatalogId = safeParse(prefixed_cuid2, catalogId);
        if (!parsedCatalogId.success) {
          return yield* Effect.fail(new CatalogInvalidId({ id: catalogId }));
        }

        const parsedProductId = safeParse(prefixed_cuid2, productId);
        if (!parsedProductId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: productId }));
        }

        const [removed] = yield* Effect.promise(() =>
          db
            .delete(TB_catalog_products)
            .where(
              and(
                eq(TB_catalog_products.catalogId, parsedCatalogId.output),
                eq(TB_catalog_products.productId, parsedProductId.output),
              ),
            )
            .returning(),
        );

        if (!removed) {
          return yield* Effect.fail(
            new CatalogProductNotFound({
              catalogId: parsedCatalogId.output,
              productId: parsedProductId.output,
            }),
          );
        }

        return removed;
      });

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new CatalogOrganizationInvalidId({ organizationId }));
        }

        return yield* Effect.promise(() =>
          db.query.TB_catalogs.findMany({
            where: (catalogs, operations) => operations.eq(catalogs.organizationId, parsedOrgId.output),
            with: {
              products: {
                with: {
                  product: {
                    with: {
                      brands: true,
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
              },
            },
          }),
        );
      });

    return {
      create,
      findById,
      update,
      remove,
      addProduct,
      removeProduct,
      findByOrganizationId,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const CatalogLive = CatalogService.Default;

// Type exports
export type CatalogInfo = NonNullable<Effect.Effect.Success<Awaited<ReturnType<CatalogService["findById"]>>>>;
