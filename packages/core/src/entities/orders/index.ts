import dayjs from "dayjs";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  CustomerOrderCreateSchema,
  CustomerOrderUpdateSchema,
  SaleItemCreate,
  TB_customer_order_products,
  TB_customer_orders,
  TB_organizations_sales,
  TB_products,
  TB_sale_items,
  TB_sales,
  TB_supplier_purchases,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { CustomerInvalidId } from "../customers/errors";
import { OrganizationInfo } from "../organizations";
import { OrganizationInvalidId } from "../organizations/errors";
import { PaperOrientation, PaperSize, PDFLive, PDFService } from "../pdf";
import { SaleNotCreated } from "../sales/errors";
import { WarehouseInvalidId } from "../warehouses/errors";
import {
  OrderInvalidId,
  OrderNotCreated,
  OrderNotDeleted,
  OrderNotFound,
  OrderNotUpdated,
  OrderUserInvalidId,
  OrderWarehouseInvalidId,
} from "./errors";

export class CustomerOrderService extends Effect.Service<CustomerOrderService>()("@warehouse/customer-orders", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const create = (userInput: InferInput<typeof CustomerOrderCreateSchema>, organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        const [order] = yield* Effect.promise(() =>
          db
            .insert(TB_customer_orders)
            .values({ ...userInput, organization_id: parsedOrgId.output })
            .returning(),
        );
        if (!order) {
          return yield* Effect.fail(new OrderNotCreated({}));
        }
        return order;
      });

    const findById = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id }));
        }

        const order = yield* Effect.promise(() =>
          db.query.TB_customer_orders.findFirst({
            where: (orders, operations) => operations.eq(orders.id, parsedId.output),
            with: {
              organization: true,
              customer: {
                with: {
                  pdt: true,
                  ppt: true,
                },
              },
              sale: {
                with: {
                  discounts: {
                    with: {
                      discount: true,
                    },
                  },
                },
              },
              users: {
                with: {
                  user: {
                    columns: {
                      hashed_password: false,
                    },
                  },
                },
              },
              products: {
                with: {
                  product: {
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
                      brands: true,
                    },
                  },
                },
              },
            },
          }),
        );

        if (!order) {
          return yield* Effect.fail(new OrderNotFound({ id }));
        }

        return order;
      });

    const update = (input: InferInput<typeof CustomerOrderUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_customer_orders)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_customer_orders.id, parsedId.output))
            .returning(),
        );

        if (!updated) {
          return yield* Effect.fail(new OrderNotUpdated({ id: input.id }));
        }

        return updated;
      });

    const remove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db.delete(TB_customer_orders).where(eq(TB_customer_orders.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new OrderNotDeleted({ id }));
        }

        return deleted;
      });

    const findByUserId = (userId: string) =>
      Effect.gen(function* (_) {
        const parsedUserId = safeParse(prefixed_cuid2, userId);
        if (!parsedUserId.success) {
          return yield* Effect.fail(new OrderUserInvalidId({ userId }));
        }

        return yield* Effect.promise(() =>
          db.query.TB_user_orders.findMany({
            where: (fields, operations) => operations.eq(fields.userId, parsedUserId.output),
            with: {
              order: {
                with: {
                  products: {
                    with: {
                      product: {
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
      });

    const safeRemove = (id: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id }));
        }

        const [deleted] = yield* Effect.promise(() =>
          db
            .update(TB_customer_orders)
            .set({ deletedAt: new Date() })
            .where(eq(TB_customer_orders.id, parsedId.output))
            .returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new OrderNotCreated({ message: "Failed to safe remove order" }));
        }

        return deleted;
      });

    const all = () =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() =>
          db.query.TB_customer_orders.findMany({
            with: {
              organization: true,
              customer: {
                with: {
                  pdt: true,
                  ppt: true,
                },
              },
              sale: {
                with: {
                  discounts: {
                    with: {
                      discount: true,
                    },
                  },
                },
              },
              users: {
                with: {
                  user: {
                    columns: {
                      hashed_password: false,
                    },
                  },
                },
              },
              products: {
                with: {
                  product: {
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
          db.query.TB_customer_orders.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, parsedOrganizationId.output),
            with: {
              organization: true,
              customer: {
                with: {
                  pdt: true,
                  ppt: true,
                },
              },
              sale: {
                with: {
                  discounts: {
                    with: {
                      discount: true,
                    },
                  },
                },
              },
              users: {
                with: {
                  user: {
                    columns: {
                      hashed_password: false,
                    },
                  },
                },
              },
              products: {
                with: {
                  product: {
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

    const findMostPopularProductsByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        return yield* Effect.promise(() =>
          db
            .select({
              product: {
                id: TB_products.id,
                name: TB_products.name,
                sku: TB_products.sku,
                description: TB_products.description,
                sellingPrice: TB_products.sellingPrice,
                status: TB_products.status,
              },
              orderCount: sql<number>`count(distinct ${TB_customer_orders.id})`,
              totalQuantity: sql<number>`sum(${TB_customer_order_products.quantity})`,
            })
            .from(TB_customer_orders)
            .innerJoin(
              TB_customer_order_products,
              eq(TB_customer_orders.id, TB_customer_order_products.customerOrderId),
            )
            .innerJoin(TB_products, eq(TB_customer_order_products.productId, TB_products.id))
            .where(eq(TB_customer_orders.organization_id, parsedOrganizationId.output))
            .groupBy(TB_products.id)
            .orderBy(
              sql`count(distinct ${TB_customer_orders.id}) desc, sum(${TB_customer_order_products.quantity}) desc`,
            )
            .limit(3),
        );
      });

    const percentageCustomerOrdersLastWeekByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const twoWeeksAgo = dayjs().subtract(14, "day").toDate();
        const aWeekAgo = dayjs().subtract(7, "day").toDate();
        const from2WeeksToAWeekAgoData = yield* Effect.promise(() =>
          db.$count(
            TB_customer_orders,
            and(
              eq(TB_customer_orders.organization_id, parsedOrganizationId.output),
              gte(TB_customer_orders.createdAt, twoWeeksAgo),
              lt(TB_customer_orders.createdAt, aWeekAgo),
            ),
          ),
        );

        const fromAWeekToTodayData = yield* Effect.promise(() =>
          db.$count(
            TB_customer_orders,
            and(
              eq(TB_customer_orders.organization_id, parsedOrganizationId.output),
              gte(TB_customer_orders.createdAt, aWeekAgo),
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

    const getCustomerOrdersChartData = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const sixMonthsAgo = dayjs().subtract(6, "month").startOf("month");
        const orders = yield* Effect.promise(() =>
          db
            .select({
              // Get month from createdAt using PostgreSQL's date_trunc
              month: sql<string>`date_trunc('month', ${TB_customer_orders.createdAt})`,
              // Count total orders per month
              count: sql<number>`count(*)`,
            })
            .from(TB_customer_orders)
            .where(
              and(
                eq(TB_customer_orders.organization_id, parsedOrganizationId.output),
                // Only get orders from last 6 months
                gte(TB_customer_orders.createdAt, sixMonthsAgo.toDate()),
              ),
            )
            // Group by month to get monthly totals
            .groupBy(sql`date_trunc('month', ${TB_customer_orders.createdAt})`)
            // Order by month ascending
            .orderBy(sql`date_trunc('month', ${TB_customer_orders.createdAt})`),
        );

        const monthLabels = Array.from({ length: 6 }, (_, i) =>
          dayjs()
            .subtract(5 - i, "month")
            .format("MMM"),
        );
        const data = monthLabels.map((month) => {
          const foundMonth = orders.find((o) => dayjs(o.month).format("MMM") === month);
          return foundMonth?.count || 0;
        });

        return data;
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

    const getPopularProductsChartData = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const products = yield* Effect.promise(() =>
          db
            .select({
              name: TB_products.name,
              // Count distinct orders to get total orders per product
              count: sql<number>`count(distinct ${TB_customer_orders.id})`,
            })
            .from(TB_customer_orders)
            .innerJoin(
              TB_customer_order_products,
              eq(TB_customer_orders.id, TB_customer_order_products.customerOrderId),
            )
            .innerJoin(TB_products, eq(TB_customer_order_products.productId, TB_products.id))
            .where(eq(TB_customer_orders.organization_id, parsedOrganizationId.output))
            .groupBy(TB_products.id)
            // Order by order count descending to get most popular first
            .orderBy(sql`count(distinct ${TB_customer_orders.id}) desc`)
            // Limit to top 5 products
            .limit(5),
        );

        return {
          labels: products.map((p) => p.name),
          data: products.map((p) => p.count),
        };
      });

    const getLastSoldProductsChartData = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const thirtyDaysAgo = dayjs().subtract(30, "days").startOf("day");
        const sales = yield* Effect.promise(() =>
          db
            .select({
              // Get day from createdAt using PostgreSQL's date_trunc
              date: sql<string>`date_trunc('day', ${TB_customer_orders.createdAt})`,
              // Sum quantities sold per day
              count: sql<number>`sum(${TB_customer_order_products.quantity})`,
            })
            .from(TB_customer_orders)
            .innerJoin(
              TB_customer_order_products,
              eq(TB_customer_orders.id, TB_customer_order_products.customerOrderId),
            )
            .where(
              and(
                eq(TB_customer_orders.organization_id, parsedOrganizationId.output),
                // Only get sales from last 30 days
                gte(TB_customer_orders.createdAt, thirtyDaysAgo.toDate()),
              ),
            )
            // Group by day to get daily totals
            .groupBy(sql`date_trunc('day', ${TB_customer_orders.createdAt})`)
            // Order by day ascending
            .orderBy(sql`date_trunc('day', ${TB_customer_orders.createdAt})`),
        );

        const dayLabels = Array.from({ length: 7 }, (_, i) =>
          dayjs()
            .subtract(6 - i, "days")
            .format("DD MMM"),
        );
        const data = dayLabels.map((day) => {
          const foundDay = sales.find((s) => dayjs(s.date).format("DD MMM") === day);
          return foundDay?.count || 0;
        });

        return {
          labels: dayLabels,
          data,
        };
      });

    const convertToSale = (id: string, cid: string, orgId: string) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id }));
        }
        const parsedCid = safeParse(prefixed_cuid2, cid);
        if (!parsedCid.success) {
          return yield* Effect.fail(new CustomerInvalidId({ id: cid }));
        }
        const parsedOrganizationId = safeParse(prefixed_cuid2, orgId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: orgId }));
        }

        const order = yield* findById(id);
        if (!order) {
          return yield* Effect.fail(new OrderNotFound({ id }));
        }
        const itemsFromOrder = order.products.map(
          (p) =>
            ({
              currency: p.product.currency,
              quantity: p.quantity,
              productId: p.product.id,
              price: p.product.sellingPrice,
            }) satisfies Omit<SaleItemCreate, "saleId">,
        );

        const [sale, ...items] = yield* Effect.promise(() =>
          db.transaction((tx) => {
            return tx
              .insert(TB_sales)
              .values({
                customerId: cid,
                organizationId: orgId,
                status: "created",
              })
              .returning()
              .catch(() => tx.rollback())
              .then(async ([sale]) => {
                const items = await tx
                  .insert(TB_sale_items)
                  .values(itemsFromOrder.map((i) => ({ ...i, saleId: sale.id })))
                  .returning()
                  .catch(() => tx.rollback());
                return [sale, ...items] as const;
              });
          }),
        );

        if (!sale) {
          return yield* Effect.fail(new SaleNotCreated());
        }

        yield* update({ id, saleId: sale.id, status: "processing" });
        yield* Effect.promise(() =>
          db
            .insert(TB_organizations_sales)
            .values({
              organizationId: orgId,
              saleId: sale.id,
            })
            .returning(),
        );

        return { sale, items };
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
        const order = yield* findById(id);
        if (!order) {
          return yield* Effect.fail(new OrderNotFound({ id }));
        }

        const pdfGenService = yield* _(PDFService);
        let generatedPdf: Buffer<ArrayBuffer> = yield* pdfGenService.order(order, organization, {
          page: options.page,
        });

        return generatedPdf;
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

    const findSupplierPurchasesByOrganizationId = (organizationId: string) =>
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
                  product: true,
                },
              },
            },
          }),
        );
        return orgPurchases;
      });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByUserId,
      findCustomerOrdersByOrganizationId,
      findSupplierPurchasesByOrganizationId,
      findMostPopularProductsByOrganizationId,
      percentageCustomerOrdersLastWeekByOrganizationId,
      percentageSupplierPurchasesLastWeekByOrganizationId,
      all,
      getCustomerOrdersChartData,
      getSupplierPurchaseChartData,
      getPopularProductsChartData,
      getLastSoldProductsChartData,
      convertToSale,
      generatePDF,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const CustomerOrderLive = CustomerOrderService.Default;

// Type exports
export type CustomerOrderInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<CustomerOrderService["findById"]>>>
>;
