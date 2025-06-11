import dayjs from "dayjs";
import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { ProductCreateSchema, ProductUpdateSchema, TB_products, TB_products_to_labels } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { DeviceInfo } from "../devices";
import { DeviceInvalidId, DeviceNotOnline, DeviceNotPrinter } from "../devices/errors";
import { OrganizationInfo } from "../organizations";
import { OrganizationInvalidId } from "../organizations/errors";
import { PaperOrientation, PaperSize, PDFLive, PDFService } from "../pdf";
import { WarehouseInvalidId } from "../warehouses/errors";
import {
  ProductInvalidId,
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

    const create = (input: InferInput<typeof ProductCreateSchema>) =>
      Effect.gen(function* (_) {
        const [product] = yield* Effect.promise(() => db.insert(TB_products).values(input).returning());
        if (!product) {
          return yield* Effect.fail(new ProductNotCreated({}));
        }
        return findById(product.id);
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id }));
        }

        const product = yield* Effect.promise(() =>
          db.query.TB_products.findFirst({
            where: (fields, operations) => operations.eq(fields.id, parsedId.output),
            with: {
              organizations: {
                with: {
                  tg: {
                    with: {
                      crs: {
                        with: {
                          tr: true,
                        },
                      },
                    },
                  },
                },
              },
              stcs: {
                with: {
                  condition: true,
                },
              },
              certs: {
                with: {
                  cert: true,
                },
              },
              images: {
                with: {
                  image: true,
                },
              },
              space: {
                with: {
                  storage: true,
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
              orders: {
                with: {
                  customerOrder: true,
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
              suppliers: {
                with: {
                  supplier: {
                    with: {
                      contacts: true,
                      notes: true,
                    },
                  },
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

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        const orgProds = yield* Effect.promise(() =>
          db.query.TB_organizations_products.findMany({
            where: (fields, operations) => operations.eq(fields.organizationId, parsedOrganizationId.output),
            with: {
              product: {
                with: {
                  images: {
                    with: {
                      image: true,
                    },
                  },
                  certs: {
                    with: {
                      cert: true,
                    },
                  },
                  space: true,
                  stcs: true,
                  catalogs: true,
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
                      customerOrder: true,
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
                  suppliers: {
                    with: {
                      supplier: {
                        with: {
                          contacts: true,
                          notes: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        );
        return orgProds
          .sort((a, b) => dayjs(a.product.createdAt).diff(dayjs(b.product.createdAt)))
          .map((op) => ({
            ...op,
            createdAt: op.product.createdAt,
            updatedAt: op.product.updatedAt,
          }));
      });

    const findByWarehouseId = (warehouseId: string) =>
      Effect.gen(function* (_) {
        const parsedWarehouseId = safeParse(prefixed_cuid2, warehouseId);
        if (!parsedWarehouseId.success) {
          return yield* Effect.fail(new WarehouseInvalidId({ id: warehouseId }));
        }
        const orgProds = yield* Effect.promise(() =>
          db.query.TB_warehouse_products.findMany({
            where: (fields, operations) => operations.eq(fields.warehouseId, parsedWarehouseId.output),
            with: {
              product: {
                with: {
                  organizations: {
                    with: {
                      tg: {
                        with: {
                          crs: {
                            with: {
                              tr: true,
                            },
                          },
                        },
                      },
                    },
                  },
                  stcs: {
                    with: {
                      condition: true,
                    },
                  },
                  certs: {
                    with: {
                      cert: true,
                    },
                  },
                  images: {
                    with: {
                      image: true,
                    },
                  },
                  space: {
                    with: {
                      storage: true,
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
                  orders: {
                    with: {
                      customerOrder: true,
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
                  suppliers: {
                    with: {
                      supplier: {
                        with: {
                          contacts: true,
                          notes: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        );
        return orgProds.map((p) => p.product).sort((a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix());
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
            .where(
              and(
                eq(TB_products_to_labels.productId, parsedProductId.output),
                eq(TB_products_to_labels.labelId, parsedLabelId.output),
              ),
            )
            .returning(),
        );

        if (!removed) {
          return yield* Effect.fail(new ProductLabelNotAdded());
        }

        return removed;
      });

    const printProductSheet = (
      printer: DeviceInfo,
      product: NonNullable<Awaited<Effect.Effect.Success<ReturnType<typeof findById>>>>,
    ) =>
      Effect.gen(function* (_) {
        const parsedPrinterId = safeParse(prefixed_cuid2, printer.id);
        if (!parsedPrinterId.success) {
          return yield* Effect.fail(new DeviceInvalidId({ id: printer.id }));
        }

        const parsedProductId = safeParse(prefixed_cuid2, product.id);
        if (!parsedProductId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: product.id }));
        }

        if (!printer.type.code.toLowerCase().includes("printer")) {
          return yield* Effect.fail(new DeviceNotPrinter({ id: printer.id }));
        }

        if (printer.status !== "online") {
          return yield* Effect.fail(new DeviceNotOnline({ id: printer.id }));
        }

        // const productSheet = yield* Effect.promise(() => {});

        const buffer = new Uint8Array(1024);

        return buffer;
      });

    const generateSheet = (
      product: NonNullable<Awaited<Effect.Effect.Success<ReturnType<typeof findById>>>>,
      organization: OrganizationInfo,
      options: {
        type: "full" | ("conditions" | "labels" | "certifications" | "suppliers" | "map" | "information")[];
        page: {
          size: PaperSize;
          orientation: PaperOrientation;
        };
      },
    ) =>
      Effect.gen(function* (_) {
        const pdfGenService = yield* _(PDFService);
        let generatedPdf: Buffer<ArrayBuffer> = yield* pdfGenService.product(
          product,
          organization,
          options.type === "full" ? ["conditions", "labels", "certifications", "map", "information"] : options.type,
          {
            page: options.page,
          },
        );

        return generatedPdf;
      }).pipe(Effect.provide(PDFLive));

    const getStockCount = (productId: string, orgId: string) =>
      Effect.gen(function* (_) {
        const parsedProductId = safeParse(prefixed_cuid2, productId);
        if (!parsedProductId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: productId }));
        }
        const parsedOrgId = safeParse(prefixed_cuid2, orgId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: orgId }));
        }

        // First check if product belongs to organization
        const orgProduct = yield* Effect.promise(() =>
          db.query.TB_organizations_products.findFirst({
            where: (products, { and, eq }) =>
              and(eq(products.productId, parsedProductId.output), eq(products.organizationId, parsedOrgId.output)),
          }),
        );

        if (!orgProduct) {
          return yield* Effect.fail(new ProductNotFound({ id: productId }));
        }

        // Get all warehouses belonging to the organization
        const orgWarehouses = yield* Effect.promise(() =>
          db.query.TB_organizations_warehouses.findMany({
            where: (ow, { eq }) => eq(ow.organizationId, parsedOrgId.output),
            with: {
              warehouse: {
                with: {
                  facilities: {
                    with: {
                      areas: {
                        with: {
                          storages: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        );

        // Get all storage spaces containing this product
        const productSpaces = yield* Effect.promise(() =>
          db.query.TB_storage_to_products.findMany({
            where: (products, { eq }) => eq(products.productId, parsedProductId.output),
            with: {
              storage: true,
            },
          }),
        );

        // Count only products in storage spaces that belong to organization's warehouses
        const storageIds = new Set(
          orgWarehouses.flatMap((ow) =>
            ow.warehouse.facilities.flatMap((f) => f.areas.flatMap((a) => a.storages.map((s) => s.id))),
          ),
        );

        const count = productSpaces.filter((ps) => storageIds.has(ps.storage.id)).length;

        return count;
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByOrganizationId,
      findByWarehouseId,
      addLabel,
      removeLabel,
      printProductSheet,
      generatePDF: generateSheet,
      getStockCount,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const ProductLive = ProductService.Default;

// Type exports
export type ProductInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<ProductService["findById"]>>>>;
export type OrganizationProductInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<ProductService["findByOrganizationId"]>>>
>[number];
