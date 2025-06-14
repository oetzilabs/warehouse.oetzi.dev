import dayjs from "dayjs";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import {
  SupplierPurchaseCreateSchema,
  SupplierPurchaseUpdateSchema,
  TB_supplier_purchases,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { InventoryLive, InventoryService } from "../inventory";
import { OrganizationInfo } from "../organizations";
import { OrganizationInvalidId } from "../organizations/errors";
import { PaperOrientation, PaperSize, PDFLive } from "../pdf";
import {
  PurchaseInvalidId,
  PurchaseNotCreated,
  PurchaseNotDeleted,
  PurchaseNotFound,
  PurchaseNotUpdated,
} from "./errors";

export class PurchasesService extends Effect.Service<PurchasesService>()("@warehouse/purchases", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const create = (userInput: InferInput<typeof SupplierPurchaseCreateSchema>, organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        const [order] = yield* Effect.promise(() =>
          db
            .insert(TB_supplier_purchases)
            .values({ ...userInput, organization_id: parsedOrgId.output })
            .returning(),
        );
        if (!order) {
          return yield* Effect.fail(new PurchaseNotCreated({}));
        }
        return order;
      });

    const findById = (id: string, organizationId: string) =>
      Effect.gen(function* (_) {
        const inventoryService = yield* _(InventoryService);
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PurchaseInvalidId({ id }));
        }

        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const order = yield* Effect.promise(() =>
          db.query.TB_supplier_purchases.findFirst({
            where: (orders, operations) => operations.eq(orders.id, parsedId.output),
            with: {
              organization: true,
              supplier: true,
              products: {
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
          }),
        );

        if (!order) {
          return yield* Effect.fail(new PurchaseNotFound({ id }));
        }

        // Filter organizations and get org-specific product data
        const filteredOrder = {
          ...order,
          products: order.products.map((p) => ({
            ...p,
            product: {
              ...p.product,
              organizations: p.product.organizations.filter((org) => org.organizationId === parsedOrgId.output),
              currency: p.product.organizations
                .find((org) => org.organizationId === parsedOrgId.output)!
                .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].currency,
              sellingPrice: p.product.organizations
                .find((org) => org.organizationId === parsedOrgId.output)!
                .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].sellingPrice,
            },
          })),
        };

        const productStocks = yield* inventoryService.getStockForProducts(
          filteredOrder.products.map((p) => p.productId),
          organizationId,
        );

        const orderWithProductStocks = {
          ...filteredOrder,
          products: filteredOrder.products.map((p) => ({
            ...p,
            product: {
              ...p.product,
              stock: productStocks.find((ps) => ps.productId === p.product.id)?.stock ?? 0,
            },
          })),
        };
        return orderWithProductStocks;
      }).pipe(Effect.provide(InventoryLive));

    const update = (input: InferInput<typeof SupplierPurchaseUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PurchaseInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_supplier_purchases)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_supplier_purchases.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new PurchaseNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PurchaseInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_supplier_purchases).where(eq(TB_supplier_purchases.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new PurchaseNotDeleted({ id }));
        }

        return deleted;
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new PurchaseInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db
            .update(TB_supplier_purchases)
            .set({ deletedAt: new Date() })
            .where(eq(TB_supplier_purchases.id, parsedId.output))
            .returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new PurchaseNotCreated({ message: "Failed to safe remove order" }));
        }

        return deleted;
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() =>
          db.query.TB_supplier_purchases.findMany({
            with: {
              organization: true,
              products: {
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
          }),
        );
      });

    const findCustomerOrdersByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        const orgOrders = yield* Effect.promise(() =>
          db.query.TB_supplier_purchases.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, parsedOrganizationId.output),
            with: {
              organization: true,
              products: {
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
          }),
        );
        return orgOrders;
      });

    const getSupplierPurchaseChartData = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const sixMonthsAgo = dayjs().subtract(6, "month").startOf("month");
        const purchases = yield* Effect.promise(() =>
          db
            .select({
              month: sql<string>`date_trunc('month', ${TB_supplier_purchases.createdAt})`,
              count: sql<number>`count(*)`,
            })
            .from(TB_supplier_purchases)
            .where(
              and(
                eq(TB_supplier_purchases.organization_id, parsedOrganizationId.output),
                gte(TB_supplier_purchases.createdAt, sixMonthsAgo.toDate()),
              ),
            )
            .groupBy(sql`date_trunc('month', ${TB_supplier_purchases.createdAt})`)
            .orderBy(sql`date_trunc('month', ${TB_supplier_purchases.createdAt})`),
        );

        const monthLabels = Array.from({ length: 6 }, (_, i) =>
          dayjs()
            .subtract(5 - i, "month")
            .format("MMM"),
        );
        const data = monthLabels.map((month) => {
          const foundMonth = purchases.find((p) => dayjs(p.month).format("MMM") === month);
          return foundMonth?.count || 0;
        });

        return data;
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
        // const order = yield* findById(id, organization.id);
        // const pdfGenService = yield* _(PDFService);
        // let generatedPdf: Buffer<ArrayBuffer> = yield* pdfGenService.order(order, organization, {
        //   page: options.page,
        // });
        // return generatedPdf;
      }).pipe(Effect.provide(PDFLive));

    const percentageSupplierPurchasesLastWeekByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const twoWeeksAgo = dayjs().subtract(14, "day").toDate();
        const aWeekAgo = dayjs().subtract(7, "day").toDate();
        const from2WeeksToAWeekAgoData = yield* Effect.promise(() =>
          db.$count(
            TB_supplier_purchases,
            and(
              eq(TB_supplier_purchases.organization_id, parsedOrganizationId.output),
              gte(TB_supplier_purchases.createdAt, twoWeeksAgo),
              lt(TB_supplier_purchases.createdAt, aWeekAgo),
            ),
          ),
        );

        const fromAWeekToTodayData = yield* Effect.promise(() =>
          db.$count(
            TB_supplier_purchases,
            and(
              eq(TB_supplier_purchases.organization_id, parsedOrganizationId.output),
              gte(TB_supplier_purchases.createdAt, aWeekAgo),
            ),
          ),
        );
        if (from2WeeksToAWeekAgoData === 0) {
          return 0;
        }
        const delta = from2WeeksToAWeekAgoData - fromAWeekToTodayData;

        const percentage = Math.round((delta / from2WeeksToAWeekAgoData) * 100);

        return percentage;
      });

    const findByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        const orgPurchases = yield* Effect.promise(() =>
          db.query.TB_supplier_purchases.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, parsedOrganizationId.output),
            with: {
              supplier: true,
              products: {
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
                      labels: true,
                    },
                  },
                },
              },
            },
          }),
        );
        return orgPurchases.map((op) => ({
          ...op,
          products: op.products.map((p) => ({
            ...p,
            product: {
              ...p.product,
              organizations: p.product.organizations.filter(
                (org) => org.organizationId === parsedOrganizationId.output,
              ),
              currency: p.product.organizations
                .find((org) => org.organizationId === parsedOrganizationId.output)!
                .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].currency,
              sellingPrice: p.product.organizations
                .find((org) => org.organizationId === parsedOrganizationId.output)!
                .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].sellingPrice,
            },
          })),
        }));
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByOrganizationId,
      percentageSupplierPurchasesLastWeekByOrganizationId,
      all,
      getSupplierPurchaseChartData,
      generatePDF,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const PurchasesLive = PurchasesService.Default;

// Type exports
export type PurchasesInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<PurchasesService["findById"]>>>>;
