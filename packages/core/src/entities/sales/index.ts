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
    const database = yield* _(DatabaseService);
    const organizationsService = yield* _(OrganizationService);
    const productService = yield* _(ProductService);
    const db = yield* database.instance;

    const create = (saleInput: InferInput<typeof SaleCreateSchema>) =>
      Effect.gen(function* (_) {
        const [sale] = yield* Effect.promise(() => db.insert(TB_sales).values(saleInput).returning());
        if (!sale) {
          return yield* Effect.fail(new SaleNotCreated({}));
        }
        return sale;
        // return yield* findById(sale.id, saleInput.organizationId);
      });

    const findById = (id: string, orgId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new SaleInvalidId({ id }));
        }
        const parsedOrgId = safeParse(prefixed_cuid2, orgId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: orgId }));
        }

        const sale = yield* Effect.promise(() =>
          db.query.TB_sales.findFirst({
            where: (fields, operations) =>
              operations.and(
                operations.eq(fields.id, parsedId.output),
                operations.eq(fields.organizationId, parsedOrgId.output),
              ),
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
              organizations: item.product.organizations.filter((org) => org.organizationId === parsedOrgId.output),
              currency: item.product.organizations
                .find((org) => org.organizationId === parsedOrgId.output)!
                .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].currency,
              sellingPrice: item.product.organizations
                .find((org) => org.organizationId === parsedOrgId.output)!
                .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].sellingPrice,
            },
          })),
        };

        return filteredSale;
      });

    const update = (id: string, saleInput: InferInput<typeof SaleUpdateSchema>) =>
      Effect.gen(function* (_) {
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

    const remove = (id: string) =>
      Effect.gen(function* (_) {
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

    const calculateTotal = (id: string, orgId: string) =>
      Effect.gen(function* (_) {
        const sale = yield* findById(id, orgId);
        if (!sale) {
          return yield* Effect.fail(new SaleNotFound({ id }));
        }
        return sale.items.reduce((total, item) => total + item.quantity * item.price, 0);
      });

    const findWithinRange = (orgId: string, start: Date, end: Date) =>
      Effect.gen(function* (_) {
        const org = yield* organizationsService.findById(orgId);
        if (!org) {
          return yield* Effect.fail(new SaleOrganizationNotFound({ orgId }));
        }
        const sales = yield* Effect.promise(() =>
          db.query.TB_organizations_sales.findMany({
            where: (fields, operations) => operations.eq(fields.organizationId, org.id),
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

    const findByOrganizationId = (orgId: string) =>
      Effect.gen(function* (_) {
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

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
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
    const generatePDF = (
      id: string,
      organization: OrganizationInfo,
      options: {
        page: {
          size: PaperSize;
          orientation: PaperOrientation;
        };
      },
    ) =>
      Effect.gen(function* (_) {
        const sale = yield* findById(id, organization.id);
        if (!sale) {
          return yield* Effect.fail(new OrderNotFound({ id }));
        }

        const pdfGenService = yield* _(PDFService);
        let generatedPdf: Buffer<ArrayBuffer> = yield* pdfGenService.sale(sale, organization, {
          page: options.page,
        });

        return generatedPdf;
      }).pipe(Effect.provide(PDFLive));

    const addProduct = (
      saleId: string,
      productId: string,
      orgId: string,
      data: Omit<InferInput<typeof SaleItemCreateSchema>, "saleId" | "productId">,
    ) =>
      Effect.gen(function* (_) {
        const parsedSaleId = safeParse(prefixed_cuid2, saleId);
        if (!parsedSaleId.success) {
          return yield* Effect.fail(new SaleInvalidId({ id: saleId }));
        }

        const parsedItemId = safeParse(prefixed_cuid2, productId);
        if (!parsedItemId.success) {
          return yield* Effect.fail(new SaleProductInvalidId({ id: productId }));
        }

        const product = yield* productService.findById(productId, orgId);

        const sale = yield* findById(saleId, orgId);
        // is the status allowed to change the product items?
        if (
          (["cancelled", "deleted", "delivered", "shipped", "confirmed"] as (typeof sale.status)[]).includes(
            sale.status,
          )
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

    const removeProduct = (saleId: string, productId: string, orgId: string) =>
      Effect.gen(function* (_) {
        const parsedSaleId = safeParse(prefixed_cuid2, saleId);
        if (!parsedSaleId.success) {
          return yield* Effect.fail(new SaleInvalidId({ id: saleId }));
        }

        const parsedItemId = safeParse(prefixed_cuid2, productId);
        if (!parsedItemId.success) {
          return yield* Effect.fail(new SaleProductInvalidId({ id: productId }));
        }

        const product = yield* productService.findById(productId, orgId);

        const sale = yield* findById(saleId, orgId);
        // is the status allowed to change the product items?
        if (
          (["cancelled", "deleted", "delivered", "shipped", "confirmed"] as (typeof sale.status)[]).includes(
            sale.status,
          )
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
    } as const;
  }),
  dependencies: [DatabaseLive, OrganizationLive, ProductLive],
}) {}

export const SalesLive = SalesService.Default;
export type SaleInfo = NonNullable<Effect.Effect.Success<ReturnType<SalesService["findById"]>>>;
export type CreatedSale = NonNullable<Effect.Effect.Success<ReturnType<SalesService["create"]>>>;
export type SaleProduct = NonNullable<Awaited<Effect.Effect.Success<ReturnType<SalesService["addProduct"]>>>>;
