import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { and, eq } from "drizzle-orm";
import { Console, Effect } from "effect";
import { InferInput, number, object, parse, safeParse } from "valibot";
import {
  SaleCreateSchema,
  SaleItemCreateSchema,
  SaleUpdateSchema,
  TB_sale_items,
  TB_sales,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrderNotFound } from "../orders/errors";
import { OrganizationInfo, OrganizationLive, OrganizationService } from "../organizations";
import { OrganizationInvalidId } from "../organizations/errors";
import { OrganizationId } from "../organizations/id";
import { PaperOrientation, PaperSize, PDFLive, PDFService } from "../pdf";
import { ProductLive, ProductService } from "../products";
import {
  SaleInvalidId,
  SaleNotCreated,
  SaleNotDeleted,
  SaleNotFound,
  SaleNotUpdated,
  SaleOrganizationNotFound,
  SaleProductInvalidId,
  SaleProductNotAdded,
  SaleProductNotFound,
  SaleProductNotRemoved,
  SaleProductNotUpdated,
} from "./errors";

dayjs.extend(isBetween);

export class SalesService extends Effect.Service<SalesService>()("@warehouse/sales", {
  effect: Effect.gen(function* (_) {
    const database = yield* DatabaseService;
    const productService = yield* ProductService;
    const db = yield* database.instance;

    const create = Effect.fn("@warehouse/sales/create")(function* (saleInput: InferInput<typeof SaleCreateSchema>) {
      const [sale] = yield* Effect.promise(() => db.insert(TB_sales).values(saleInput).returning());
      if (!sale) {
        return yield* Effect.fail(new SaleNotCreated({}));
      }
      return sale;
      // return yield* findById(sale.id, saleInput.organizationId);
    });

    const findById = Effect.fn("@warehouse/sales/findById")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SaleInvalidId({ id }));
      }
      const orgId = yield* OrganizationId;

      const sale = yield* Effect.promise(() =>
        db.query.TB_sales.findFirst({
          where: (fields, operations) =>
            operations.and(operations.eq(fields.id, parsedId.output), operations.eq(fields.organizationId, orgId)),
          with: {
            items: {
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
                    brands: true,
                  },
                },
              },
            },
            customer: true,
          },
        }),
      );

      if (!sale) {
        return yield* Effect.fail(new SaleNotFound({ id }));
      }

      // Filter and map organization-specific product data
      const filteredSale = {
        ...sale,
        items: sale.items.map((item) => ({
          ...item,
          product: {
            ...item.product,
            organizations: item.product.organizations.filter((org) => org.organizationId === orgId),
            currency: item.product.organizations
              .find((org) => org.organizationId === orgId)!
              .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].currency,
            sellingPrice: item.product.organizations
              .find((org) => org.organizationId === orgId)!
              .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].sellingPrice,
          },
        })),
      };

      return filteredSale;
    });

    const update = Effect.fn("@warehouse/sales/update")(function* (
      id: string,
      saleInput: InferInput<typeof SaleUpdateSchema>,
    ) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SaleInvalidId({ id }));
      }
      const [updatedSale] = yield* Effect.promise(() =>
        db
          .update(TB_sales)
          .set({ ...saleInput, updatedAt: new Date() })
          .where(eq(TB_sales.id, parsedId.output))
          .returning(),
      );
      if (!updatedSale) {
        return yield* Effect.fail(new SaleNotUpdated({ id }));
      }
      return updatedSale;
    });

    const remove = Effect.fn("@warehouse/sales/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SaleInvalidId({ id }));
      }
      const [deletedSale] = yield* Effect.promise(() =>
        db.delete(TB_sales).where(eq(TB_sales.id, parsedId.output)).returning(),
      );
      if (!deletedSale) {
        return yield* Effect.fail(new SaleNotDeleted({ id }));
      }
      return deletedSale;
    });

    const calculateTotal = Effect.fn("@warehouse/sales/calculateTotal")(function* (id: string) {
      const sale = yield* findById(id);
      if (!sale) {
        return yield* Effect.fail(new SaleNotFound({ id }));
      }
      return sale.items.reduce((total, item) => total + item.quantity * item.price, 0);
    });

    const findWithinRange = Effect.fn("@warehouse/sales/findWithinRange")(function* (start: Date, end: Date) {
      const orgId = yield* OrganizationId;
      const sales = yield* Effect.promise(() =>
        db.query.TB_organizations_sales.findMany({
          where: (fields, operations) => operations.eq(fields.organizationId, orgId),
          with: {
            sale: {
              with: {
                items: {
                  with: {
                    product: true,
                  },
                },
                customer: true,
              },
            },
          },
        }),
      );
      return sales.filter((s) => dayjs(s.sale.createdAt).isBetween(start, end));
    });

    const findByOrganizationId = Effect.fn("@warehouse/sales/findByOrganizationId")(function* (orgId: string) {
      const parsedOrgId = safeParse(prefixed_cuid2, orgId);
      if (!parsedOrgId.success) {
        return yield* Effect.fail(new OrganizationInvalidId({ id: orgId }));
      }
      const sales = yield* Effect.promise(() =>
        db.query.TB_organizations_sales.findMany({
          where: (fields, operations) => operations.eq(fields.organizationId, parsedOrgId.output),
          with: {
            sale: {
              with: {
                items: {
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
                        brands: true,
                      },
                    },
                  },
                },
                customer: true,
              },
            },
          },
        }),
      );

      // Filter and map organization-specific product data
      const filteredSales = sales.map((s) => ({
        ...s,
        sale: {
          ...s.sale,
          items: s.sale.items.map((item) => ({
            ...item,
            product: {
              ...item.product,
              organizations: item.product.organizations.filter((org) => org.organizationId === parsedOrgId.output),
              priceHistory:
                item.product.organizations
                  .find((o) => o.organizationId === parsedOrgId.output)
                  ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime()) || [],
              currency: item.product.organizations
                .find((org) => org.organizationId === parsedOrgId.output)!
                .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].currency,
              sellingPrice: item.product.organizations
                .find((org) => org.organizationId === parsedOrgId.output)!
                .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].sellingPrice,
            },
          })),
        },
      }));

      return filteredSales.map((s) => s.sale);
    });

    const safeRemove = Effect.fn("@warehouse/sales/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new SaleInvalidId({ id }));
      }

      const [deleted] = yield* Effect.promise(() =>
        db
          .update(TB_sales)
          .set({ status: "deleted", deletedAt: new Date(), updatedAt: new Date() })
          .where(eq(TB_sales.id, parsedId.output))
          .returning(),
      );

      if (!deleted) {
        return yield* Effect.fail(new SaleNotDeleted({ id }));
      }

      return deleted;
    });

    const generatePDF = Effect.fn("@warehouse/sales/generatePdf")(
      function* (
        id: string,
        organization: OrganizationInfo,
        options: {
          page: {
            size: PaperSize;
            orientation: PaperOrientation;
          };
        },
      ) {
        const sale = yield* findById(id);
        if (!sale) {
          return yield* Effect.fail(new OrderNotFound({ id }));
        }

        const pdfGenService = yield* _(PDFService);
        let generatedPdf: Buffer<ArrayBuffer> = yield* pdfGenService.sale(sale, organization, {
          page: options.page,
        });

        return generatedPdf;
      },
      (effect) => effect.pipe(Effect.provide(PDFLive)),
    );

    const addProduct = Effect.fn("@warehouse/sales/addProduct")(function* (
      saleId: string,
      productId: string,
      data: Omit<InferInput<typeof SaleItemCreateSchema>, "saleId" | "productId">,
    ) {
      const parsedSaleId = safeParse(prefixed_cuid2, saleId);
      if (!parsedSaleId.success) {
        return yield* Effect.fail(new SaleInvalidId({ id: saleId }));
      }

      const parsedItemId = safeParse(prefixed_cuid2, productId);
      if (!parsedItemId.success) {
        return yield* Effect.fail(new SaleProductInvalidId({ id: productId }));
      }

      const product = yield* productService.findById(productId);

      const sale = yield* findById(saleId);
      // is the status allowed to change the product items?
      if (
        (["cancelled", "deleted", "delivered", "shipped", "confirmed"] as (typeof sale.status)[]).includes(sale.status)
      ) {
        return yield* Effect.fail(new SaleProductNotAdded({ saleId, productId }));
      }

      // does the sale have the product already?
      const exists = yield* Effect.promise(() =>
        db.query.TB_sale_items.findFirst({
          where: (fields, operations) =>
            and(eq(fields.saleId, parsedSaleId.output), eq(fields.productId, parsedItemId.output)),
        }),
      );

      if (exists) {
        return yield* Effect.fail(new SaleProductNotAdded({ saleId, productId }));
      }

      const [added] = yield* Effect.promise(() =>
        db
          .insert(TB_sale_items)
          .values({ ...data, saleId: parsedSaleId.output, productId: parsedItemId.output })
          .returning(),
      );

      if (!added) {
        return yield* Effect.fail(new SaleProductNotAdded({ saleId, productId }));
      }
      return added;
    });

    const removeProduct = Effect.fn("@warehouse/sales/removeProduct")(function* (saleId: string, productId: string) {
      const parsedSaleId = safeParse(prefixed_cuid2, saleId);
      if (!parsedSaleId.success) {
        return yield* Effect.fail(new SaleInvalidId({ id: saleId }));
      }

      const parsedItemId = safeParse(prefixed_cuid2, productId);
      if (!parsedItemId.success) {
        return yield* Effect.fail(new SaleProductInvalidId({ id: productId }));
      }

      const product = yield* productService.findById(productId);

      const sale = yield* findById(saleId);
      // is the status allowed to change the product items?
      if (
        (["cancelled", "deleted", "delivered", "shipped", "confirmed"] as (typeof sale.status)[]).includes(sale.status)
      ) {
        return yield* Effect.fail(new SaleProductNotAdded({ saleId, productId }));
      }

      const [removed] = yield* Effect.promise(() =>
        db
          .delete(TB_sale_items)
          .where(and(eq(TB_sale_items.saleId, parsedSaleId.output), eq(TB_sale_items.productId, parsedItemId.output)))
          .returning(),
      );

      if (!removed) {
        return yield* Effect.fail(new SaleProductNotRemoved({ saleId, productId }));
      }

      return removed;
    });

    const listIncomes = Effect.fn("@warehouse/sales/listIncomes")(function* () {
      const orgId = yield* OrganizationId;
      const sales = yield* Effect.promise(() =>
        db.query.TB_organizations_sales.findMany({
          where: (fields, operations) => operations.eq(fields.organizationId, orgId),
          with: {
            sale: {
              with: {
                customer: true,
                items: {
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
                        brands: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      );
      // Flatten all sale items and products
      const allSales = sales.map((s) => s.sale);
      const allItems = allSales.flatMap((sale) => sale.items);

      // For each sale, for each item, find the latest priceHistory for the product in this org and calculate value
      const result = allSales.flatMap((sale) =>
        sale.items.map((item) => {
          // Find the organization-specific product data
          const orgProduct = item.product.organizations.find((org) => org.organizationId === orgId);
          // Find the latest priceHistory entry (by effectiveDate)
          const priceHistorySorted =
            orgProduct?.priceHistory?.toSorted((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime()) ?? [];
          const latestPrice = priceHistorySorted[0];
          return {
            name: item.productId,
            value: latestPrice ? latestPrice.sellingPrice * Math.abs(item.quantity) : 0,
            currency: latestPrice ? latestPrice.currency : "USD",
            date: sale.updatedAt ?? sale.createdAt,
            metadata: {
              saleId: sale.id,
              quantity: item.quantity,
              createdAt: sale.createdAt,
              customerId: sale.customerId,
            },
          };
        }),
      );
      return result;
    });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      calculateTotal,
      findWithinRange,
      addProduct,
      removeProduct,
      findByOrganizationId,
      generatePDF,
      listIncomes,
    } as const;
  }),
  dependencies: [DatabaseLive, ProductLive],
}) {}

export const SalesLive = SalesService.Default;
export type SaleInfo = NonNullable<Effect.Effect.Success<ReturnType<SalesService["findById"]>>>;
export type CreatedSale = NonNullable<Effect.Effect.Success<ReturnType<SalesService["create"]>>>;
export type SaleProduct = NonNullable<Awaited<Effect.Effect.Success<ReturnType<SalesService["addProduct"]>>>>;
