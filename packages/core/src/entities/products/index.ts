import dayjs from "dayjs";
import { and, desc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { InferInput, safeParse } from "valibot";
import {
  ProductCreateSchema,
  ProductSelect,
  ProductUpdateSchema,
  TB_organization_product_price_history,
  TB_organizations_products,
  TB_products,
  TB_products_to_certifications,
  TB_products_to_labels,
  TB_products_to_storage_conditions,
  TB_supplier_product_price_history,
  TB_supplier_products,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { DeviceInfo } from "../devices";
import { DeviceInvalidId, DeviceNotOnline, DeviceNotPrinter } from "../devices/errors";
import { OrganizationInfo } from "../organizations";
import { OrganizationInvalidId, OrganizationProductNotAdded } from "../organizations/errors";
import { OrganizationId } from "../organizations/id";
import { PaperOrientation, PaperSize, PDFLive, PDFService } from "../pdf";
import { SupplierInfo, SupplierLive, SupplierService } from "../suppliers";
import { SupplierInvalidId } from "../suppliers/errors";
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
import { NewProductFormData } from "./schemas";

export class ProductService extends Effect.Service<ProductService>()("@warehouse/products", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const create = Effect.fn("@warehouse/products/create")(function* (
      input: InferInput<typeof ProductCreateSchema>,
      additions: Omit<NewProductFormData, "product">, // 'additions' is not directly used in the current transaction logic, but keeping it for consistency if it's used elsewhere
    ) {
      const orgId = yield* OrganizationId; // Run the Effect to get orgId
      const r = yield* Effect.async<ProductSelect, ProductNotCreated | OrganizationProductNotAdded>((resume) => {
        db.transaction(async (tx) => {
          try {
            const [product] = await tx.insert(TB_products).values(input).returning();

            if (!product) {
              throw new ProductNotCreated({});
            }

            const [org_product] = await tx
              .insert(TB_organizations_products)
              .values({ organizationId: orgId, productId: product.id })
              .returning();

            if (!org_product) {
              throw new OrganizationProductNotAdded({
                organizationId: orgId,
                productId: product.id,
              });
            }
            // add the price to the price history
            await tx
              .insert(TB_organization_product_price_history)
              .values({
                productId: product.id,
                organizationId: orgId,
                effectiveDate: new Date(),
                currency: additions.price.currency,
                sellingPrice: additions.price.sellingPrice,
              })
              .returning();
            // add the purchase price to the price history of the supplier of the product
            if (additions.suppliers.length > 0) {
              for (const supplier of additions.suppliers) {
                await tx
                  .insert(TB_supplier_products)
                  .values({ productId: product.id, supplierId: supplier.supplier })
                  .returning();
                await tx
                  .insert(TB_supplier_product_price_history)
                  .values({
                    productId: product.id,
                    supplierId: supplier.supplier,
                    effectiveDate: new Date(),
                    currency: supplier.currency ?? "EUR",
                    supplierPrice: supplier.purchasePrice ?? 0.0,
                  })
                  .returning();
              }
            }
            if (additions.images.length > 0) {
              // upload the image
              // assume its uploaded.
              /*
                for (const image of additions.images) {
                  const image = await uploadImage(additions.images);
                  await tx.insert(TB_product_images).values({ productId: product.id, imageId: image.id }).returning();
                }
                */
            }
            if (additions.labels.length > 0) {
              // add labels
              for (const labelId of additions.labels) {
                await tx.insert(TB_products_to_labels).values({ productId: product.id, labelId: labelId }).returning();
              }
            }
            for (const certificateId of additions.certificates) {
              await tx
                .insert(TB_products_to_certifications)
                .values({ productId: product.id, certificationId: certificateId })
                .returning();
            }
            for (const conditionId of additions.conditions) {
              await tx
                .insert(TB_products_to_storage_conditions)
                .values({ productId: product.id, conditionId: conditionId })
                .returning();
            }

            resume(Effect.succeed(product));
          } catch (error) {
            if (error instanceof ProductNotCreated) {
              resume(Effect.fail(error));
            } else if (error instanceof OrganizationProductNotAdded) {
              resume(Effect.fail(error));
            } else {
              resume(
                Effect.fail(
                  new ProductNotCreated({
                    message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
                  }),
                ),
              );
            }
            await tx.rollback();
          }
        });
      });
      return r;
    });

    const findById = Effect.fn("@warehouse/products/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id }));
      }
      const orgId = yield* OrganizationId;

      const product = yield* Effect.promise(() =>
        db.query.TB_organizations_products.findFirst({
          where: (fields, operations) =>
            operations.and(
              operations.eq(fields.productId, parsedId.output),
              operations.eq(fields.organizationId, orgId),
            ),
          with: {
            product: {
              with: {
                organizations: {
                  with: {
                    priceHistory: true,
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
                purchases: {
                  with: {
                    product: true,
                    supplierPurchase: {
                      with: {
                        products: true,
                      },
                    },
                  },
                },
                suppliers: {
                  with: {
                    priceHistory: true,
                    supplier: {
                      with: {
                        schedules: true,
                        contacts: true,
                        notes: true,
                        purchases: {
                          with: {
                            products: true,
                          },
                        },
                      },
                    },
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

      return {
        ...product.product,
        taxGroupName: product.product.organizations.find((org) => org.organizationId === orgId)?.tg?.name ?? "unknown",
        taxGroupRate:
          product.product.organizations.find((org) => org.organizationId === orgId)?.tg?.crs[0]?.tr.rate ?? "unknown",
        minimumStock: product.product.organizations.find((o) => o.organizationId === orgId)?.minimumStock ?? 0,
        maximumStock: product.product.organizations.find((o) => o.organizationId === orgId)?.maximumStock ?? 0,
        reorderPoint: product.product.organizations.find((o) => o.organizationId === orgId)?.reorderPoint ?? 0,
        priceHistory:
          product.product.organizations
            .find((o) => o.organizationId === orgId)
            ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime()) || [],
        currency:
          product.product.organizations
            .find((org) => org.organizationId === orgId)
            ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0]?.currency ??
          "unknown",
        sellingPrice:
          product.product.organizations
            .find((org) => org.organizationId === orgId)
            ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0]?.sellingPrice ??
          0.0,
        preferredDate:
          product.product.purchases.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())?.[0]?.supplierPurchase
            ?.createdAt ?? dayjs().add(3, "days").toDate(),
      };
    });

    const update = Effect.fn("@warehouse/products/update")(function* (
      id: string,
      input: InferInput<typeof ProductUpdateSchema>,
    ) {
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

    const remove = Effect.fn("@warehouse/products/remove")(function* (id: string) {
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

    const safeRemove = Effect.fn("@warehouse/products/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) return yield* Effect.fail(new ProductInvalidId({ id }));
      const [deleted] = yield* Effect.promise(() =>
        db.update(TB_products).set({ deletedAt: new Date() }).where(eq(TB_products.id, parsedId.output)).returning(),
      );
      return deleted;
    });

    const findByOrganizationId = Effect.fn("@warehouse/products/findByOrganizationId")(function* (
      organizationId: string,
    ) {
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
                organizations: {
                  with: {
                    priceHistory: true,
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
          minimumStock:
            op.product.organizations.find((o) => o.organizationId === parsedOrganizationId.output)?.minimumStock ?? 0,
          maximumStock:
            op.product.organizations.find((o) => o.organizationId === parsedOrganizationId.output)?.maximumStock ?? 0,
          reorderPoint:
            op.product.organizations.find((o) => o.organizationId === parsedOrganizationId.output)?.reorderPoint ?? 0,
          currency:
            op.product.organizations
              .find((org) => org.organizationId === parsedOrganizationId.output)
              ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0]?.currency ??
            "unknown",
          sellingPrice:
            op.product.organizations
              .find((org) => org.organizationId === parsedOrganizationId.output)
              ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0]?.sellingPrice ??
            0.0,
          taxGroupName:
            op.product.organizations.find((org) => org.organizationId === parsedOrganizationId.output)?.tg?.name ??
            "unknown",
          taxGroupRate:
            op.product.organizations.find((org) => org.organizationId === parsedOrganizationId.output)?.tg?.crs[0]?.tr
              .rate ?? "unknown",
        }))
        .filter((p) => p.taxGroupName !== undefined && p.taxGroupRate !== undefined);
    });

    const findByWarehouseId = Effect.fn("@warehouse/products/findByWarehouseId")(function* (warehouseId: string) {
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
                    priceHistory: true,
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

    const addLabel = Effect.fn("@warehouse/products/addLabel")(function* (productId: string, labelId: string) {
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

    const removeLabel = Effect.fn("@warehouse/products/removeLabel")(function* (productId: string, labelId: string) {
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

    const printProductSheet = Effect.fn("@warehouse/products/printProductSheet")(function* (
      printer: DeviceInfo,
      product: NonNullable<Awaited<Effect.Effect.Success<ReturnType<typeof findById>>>>,
    ) {
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

    const generateSheet = Effect.fn("@warehouse/products/generateSheet")(
      function* (
        product: NonNullable<Awaited<Effect.Effect.Success<ReturnType<typeof findById>>>>,
        organization: OrganizationInfo,
        options: {
          type: "full" | ("conditions" | "labels" | "certifications" | "suppliers" | "map" | "information")[];
          page: {
            size: PaperSize;
            orientation: PaperOrientation;
          };
        },
      ) {
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
      },
      (effect) => effect.pipe(Effect.provide(PDFLive)),
    );

    const getStockCount = Effect.fn("@warehouse/products/getStockCount")(function* (productId: string) {
      const parsedProductId = safeParse(prefixed_cuid2, productId);
      if (!parsedProductId.success) {
        return yield* Effect.fail(new ProductInvalidId({ id: productId }));
      }

      const orgId = yield* OrganizationId;

      // First check if product belongs to organization
      const orgProduct = yield* Effect.promise(() =>
        db.query.TB_organizations_products.findFirst({
          where: (products, { and, eq }) =>
            and(eq(products.productId, parsedProductId.output), eq(products.organizationId, orgId)),
        }),
      );

      if (!orgProduct) {
        return yield* Effect.fail(new ProductNotFound({ id: productId }));
      }

      // Get all warehouses belonging to the organization
      const orgWarehouses = yield* Effect.promise(() =>
        db.query.TB_organizations_warehouses.findMany({
          where: (ow, { eq }) => eq(ow.organizationId, orgId),
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

    const getPriceHistory = Effect.fn("@warehouse/products/getPriceHistory")(
      function* (productId: string) {
        const parsedProductId = safeParse(prefixed_cuid2, productId);
        if (!parsedProductId.success) {
          return yield* Effect.fail(new ProductInvalidId({ id: productId }));
        }
        const orgId = yield* OrganizationId;

        const supplierService = yield* _(SupplierService);

        const [latestSellingPrice] = yield* Effect.promise(() =>
          db
            .select()
            .from(TB_organization_product_price_history)
            .where(
              and(
                eq(TB_organization_product_price_history.organizationId, orgId),
                eq(TB_organization_product_price_history.productId, productId),
              ),
            )
            .orderBy(desc(TB_organization_product_price_history.effectiveDate))
            .limit(1),
        );

        const latestPurchasePrices = yield* Effect.promise(() =>
          db
            .select()
            .from(TB_supplier_product_price_history)
            .where(eq(TB_supplier_product_price_history.productId, productId))
            .orderBy(desc(TB_supplier_product_price_history.effectiveDate)),
        );

        // lets make a map of the latest purchase prices by supplier. { supplier: x, pricing: latestPrices }
        const supplierPricesMap: {
          supplier: SupplierInfo;
          pricing: (typeof latestPurchasePrices)[number];
        }[] = [];
        for (const purchasePrice of latestPurchasePrices) {
          const supplier = yield* supplierService.findById(purchasePrice.supplierId);
          supplierPricesMap.push({
            supplier: supplier,
            pricing: purchasePrice,
          });
        }

        return { latestSellingPrice, latestPurchasePrices };
      },
      (effect) => effect.pipe(Effect.provide(SupplierLive)),
    );

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
      getPriceHistory,
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
export type ProductSupplierInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<ProductService["findById"]>>>
>["suppliers"][number];
