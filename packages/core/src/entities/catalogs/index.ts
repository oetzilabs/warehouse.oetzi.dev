import { and, eq } from "drizzle-orm";
import { Console, Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { CatalogCreateSchema, CatalogUpdateSchema, TB_catalog_products, TB_catalogs } from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationId } from "../organizations/id";
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
    const db = yield* DatabaseService;

    const slugify = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    };

    const ensureBarcodeIsUnique = Effect.fn("@warehouse/catalogs/ensureBarcodeIsUnique")(function* (
      input: string,
      existingBarcode?: string | undefined,
    ) {
      const slugified = slugify(input);
      if (existingBarcode && existingBarcode !== slugified) {
        return existingBarcode;
      }

      let barcode = slugified;
      let counter = 1;
      let exists;

      do {
        exists = yield* db.query.TB_catalogs.findFirst({
          where: (fields, operations) => operations.eq(fields.barcode, barcode),
        });
        if (!!exists) {
          barcode = `${slugify(input)}-${counter++}`;
        }
      } while (!!exists);
      return barcode;
    });

    const create = Effect.fn("@warehouse/catalogs/create")(function* (
      input: InferInput<typeof CatalogCreateSchema>,
      userId: string,
    ) {
      const orgId = yield* OrganizationId;

      let barcode = yield* ensureBarcodeIsUnique(input.name);

      const [catalog] = yield* db
        .insert(TB_catalogs)
        .values({ ...input, ownerId: userId, organizationId: orgId, barcode })
        .returning();

      if (!catalog) {
        return yield* Effect.fail(new CatalogNotCreated());
      }

      return catalog;
    });

    const findById = Effect.fn("@warehouse/catalogs/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new CatalogInvalidId({ id }));
      }
      const orgId = yield* OrganizationId;

      const catalog = yield* db.query.TB_catalogs.findFirst({
        where: (catalogs, operations) => operations.eq(catalogs.id, parsedId.output),
        with: {
          products: {
            with: {
              product: {
                with: {
                  images: {
                    with: {
                      image: true,
                    },
                  },
                  organizations: {
                    with: {
                      priceHistory: true,
                    },
                  },
                  brands: true,
                },
              },
            },
          },
        },
      });

      if (!catalog) {
        return yield* Effect.fail(new CatalogNotFound({ id }));
      }

      return {
        ...catalog,
        products: catalog.products.map((p) => ({
          ...p,
          product: {
            ...p.product,
            organization: p.product.organizations.find((o) => o.organizationId === orgId),
            priceHistory:
              p.product.organizations
                .find((o) => o.organizationId === orgId)
                ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime()) ?? [],
            sellingPrice:
              p.product.organizations
                .find((o) => o.organizationId === orgId)
                ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0]?.sellingPrice ??
              0.0,
            currency:
              p.product.organizations
                .find((o) => o.organizationId === orgId)
                ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0]?.currency ??
              "unknown",
          },
        })),
      };
    });

    const update = Effect.fn("@warehouse/catalogs/update")(function* (input: InferInput<typeof CatalogUpdateSchema>) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new CatalogInvalidId({ id: input.id }));
      }

      const existingBarcode = yield* db.query.TB_catalogs.findFirst({
        where: (fields, operations) => operations.eq(fields.id, parsedId.output),
      });
      if (!existingBarcode) {
        return yield* Effect.fail(new CatalogNotFound({ id: input.id }));
      }

      let updatedBarcode = yield* ensureBarcodeIsUnique(input.name, existingBarcode.barcode);

      const [updated] = yield* db
        .update(TB_catalogs)
        .set({ ...input, updatedAt: new Date(), barcode: updatedBarcode })
        .where(eq(TB_catalogs.id, parsedId.output))
        .returning();

      if (!updated) {
        return yield* Effect.fail(new CatalogNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const safeRemove = Effect.fn("@warehouse/catalogs/safeRemove")(function* (input: string) {
      const parsedId = safeParse(prefixed_cuid2, input);
      if (!parsedId.success) {
        return yield* Effect.fail(new CatalogInvalidId({ id: input }));
      }

      const [updated] = yield* db
        .update(TB_catalogs)
        .set({ deletedAt: new Date() })
        .where(eq(TB_catalogs.id, parsedId.output))
        .returning();

      if (!updated) {
        return yield* Effect.fail(new CatalogNotUpdated({ id: parsedId.output }));
      }

      return updated;
    });

    const remove = Effect.fn("@warehouse/catalogs/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new CatalogInvalidId({ id }));
      }

      const [deleted] = yield* db.delete(TB_catalogs).where(eq(TB_catalogs.id, parsedId.output)).returning();

      if (!deleted) {
        return yield* Effect.fail(new CatalogNotDeleted({ id }));
      }

      return deleted;
    });

    const addProduct = Effect.fn("@warehouse/catalogs/addProduct")(function* (
      catalogId: string,
      productId: string,
      discount: number = 0,
    ) {
      const parsedCatalogId = safeParse(prefixed_cuid2, catalogId);
      if (!parsedCatalogId.success) {
        return yield* Effect.fail(new CatalogInvalidId({ id: catalogId }));
      }

      const parsedProductId = safeParse(prefixed_cuid2, productId);
      if (!parsedProductId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: productId }));
      }

      const exists = yield* db.query.TB_catalog_products.findFirst({
        where: (fields, operations) =>
          and(eq(fields.catalogId, parsedCatalogId.output), eq(fields.productId, parsedProductId.output)),
      });

      if (exists) {
        return yield* Effect.fail(
          new CatalogProductAlreadyExists({
            catalogId: parsedCatalogId.output,
            productId: parsedProductId.output,
          }),
        );
      }

      const [entry] = yield* db
        .insert(TB_catalog_products)
        .values({
          catalogId: parsedCatalogId.output,
          productId: parsedProductId.output,
          discount,
        })
        .returning();

      return entry;
    });

    const removeProduct = Effect.fn("@warehouse/catalogs/removeProduct")(function* (
      catalogId: string,
      productId: string,
    ) {
      const parsedCatalogId = safeParse(prefixed_cuid2, catalogId);
      if (!parsedCatalogId.success) {
        return yield* Effect.fail(new CatalogInvalidId({ id: catalogId }));
      }

      const parsedProductId = safeParse(prefixed_cuid2, productId);
      if (!parsedProductId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: productId }));
      }

      const [removed] = yield* db
        .delete(TB_catalog_products)
        .where(
          and(
            eq(TB_catalog_products.catalogId, parsedCatalogId.output),
            eq(TB_catalog_products.productId, parsedProductId.output),
          ),
        )
        .returning();

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

    const findAll = Effect.fn("@warehouse/catalogs/findAll")(function* () {
      const orgId = yield* OrganizationId;

      const catalogs = yield* db.query.TB_catalogs.findMany({
        where: (catalogs, operations) => operations.eq(catalogs.organizationId, orgId),
        with: {
          products: {
            with: {
              product: {
                with: {
                  images: {
                    with: {
                      image: true,
                    },
                  },
                  organizations: {
                    with: {
                      priceHistory: true,
                    },
                  },
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
                  orders: true,
                  purchases: true,
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
        orderBy: (fields, operations) => [operations.desc(fields.createdAt), operations.desc(fields.deletedAt)],
      });

      return catalogs.map((catalog) => ({
        ...catalog,
        products: catalog.products.map((p) => ({
          ...p,
          product: {
            ...p.product,
            organization: p.product.organizations.find((o) => o.organizationId === orgId),
            priceHistory:
              p.product.organizations
                .find((o) => o.organizationId === orgId)
                ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime()) || [],
            sellingPrice:
              p.product.organizations
                .find((o) => o.organizationId === orgId)
                ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0]?.sellingPrice ||
              0,
            currency:
              p.product.organizations
                .find((o) => o.organizationId === orgId)
                ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0]?.currency ||
              "USD",
          },
        })),
      }));
    });

    const printSheet = Effect.fn("@warehouse/catalogs/printSheet")(function* (
      catalogId: string,
      deviceId: string,
      productId: string,
    ) {
      const parsedCatalogId = safeParse(prefixed_cuid2, catalogId);
      if (!parsedCatalogId.success) {
        return yield* Effect.fail(new CatalogInvalidId({ id: catalogId }));
      }
      const parsedProductId = safeParse(prefixed_cuid2, productId);
      if (!parsedProductId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: productId }));
      }
      const parsedDeviceId = safeParse(prefixed_cuid2, deviceId);
      if (!parsedDeviceId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: deviceId }));
      }
      const catalog = yield* db.query.TB_catalogs.findFirst({
        where: (catalogs, operations) => operations.eq(catalogs.id, parsedCatalogId.output),
        with: {
          products: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!catalog) {
        return yield* Effect.fail(new CatalogNotFound({ id: catalogId }));
      }
      const device = yield* db.query.TB_devices.findFirst({
        where: (devices, operations) => operations.eq(devices.id, parsedDeviceId.output),
      });
      if (!device) {
        return yield* Effect.fail(new ProductNotFound({ id: deviceId }));
      }
      // !TODO: implement the print sheet logic, meaning I gotta connect to the printer and send the generated PDF.
      // For now, just return true
      return true;
    });

    const downloadSheet = Effect.fn("@warehouse/catalogs/downloadSheet")(function* (catalogId: string) {
      const parsedCatalogId = safeParse(prefixed_cuid2, catalogId);
      if (!parsedCatalogId.success) {
        return yield* Effect.fail(new CatalogInvalidId({ id: catalogId }));
      }
      const catalog = yield* db.query.TB_catalogs.findFirst({
        where: (catalogs, operations) => operations.eq(catalogs.id, parsedCatalogId.output),
        with: {
          products: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!catalog) {
        return yield* Effect.fail(new CatalogNotFound({ id: catalogId }));
      }
      // check if the catalog PDF has already been generated

      return {
        name: catalog.name,
        pdf: new Uint8Array(1024),
      };
    });

    const getProducts = Effect.fn("@warehouse/catalogs/getProducts")(function* (catalogId: string) {
      const parsedCatalogId = safeParse(prefixed_cuid2, catalogId);
      if (!parsedCatalogId.success) {
        return yield* Effect.fail(new CatalogInvalidId({ id: catalogId }));
      }
      const catalog = yield* db.query.TB_catalogs.findFirst({
        where: (catalogs, operations) => operations.eq(catalogs.id, parsedCatalogId.output),
        with: {
          products: {
            with: {
              product: true,
            },
          },
        },
      });

      if (!catalog) {
        return yield* Effect.fail(new CatalogNotFound({ id: catalogId }));
      }

      return catalog.products.map((p) => p.product);
    });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      addProduct,
      removeProduct,
      findAll,
      getProducts,
      printSheet,
      downloadSheet,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const CatalogLive = CatalogService.Default;

// Type exports
export type CatalogInfo = NonNullable<Effect.Effect.Success<Awaited<ReturnType<CatalogService["findById"]>>>>;

export type CatalogAllFromOrganizationInfo = NonNullable<
  Effect.Effect.Success<Awaited<ReturnType<CatalogService["findAll"]>>>
>[number];
