import dayjs from "dayjs";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import {
  OrderCreateSchema,
  OrderUpdateSchema,
  TB_order_products,
  TB_orders,
  TB_organizations_customerorders,
  TB_organizations_supplierorders,
  TB_products,
} from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationInvalidId } from "../organizations/errors";
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

export class OrderService extends Effect.Service<OrderService>()("@warehouse/orders", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    type FindManyParams = NonNullable<Parameters<typeof db.query.TB_orders.findMany>[0]>;

    const withRelations = (options?: NonNullable<FindManyParams["with"]>): NonNullable<FindManyParams["with"]> => {
      const defaultRelations: NonNullable<FindManyParams["with"]> = {
        users: {
          with: {
            user: {
              columns: {
                hashed_password: false,
              },
            },
          },
        },
        custSched: {
          with: {
            schedule: true,
          },
        },
        prods: {
          with: {
            product: true,
          },
        },
      };

      if (options) {
        return options;
      }
      return defaultRelations;
    };

    const create = (userInput: InferInput<typeof OrderCreateSchema>) =>
      Effect.gen(function* (_) {
        const [order] = yield* Effect.promise(() => db.insert(TB_orders).values(userInput).returning());
        if (!order) {
          return yield* Effect.fail(new OrderNotCreated({}));
        }
        return order;
      });

    const findById = (id: string, relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id }));
        }

        const order = yield* Effect.promise(() =>
          db.query.TB_orders.findFirst({
            where: (orders, operations) => operations.eq(orders.id, parsedId.output),
            with: {
              users: {
                with: {
                  user: {
                    columns: {
                      hashed_password: false,
                    },
                  },
                },
              },
              custSched: {
                with: {
                  schedule: true,
                },
              },
              prods: {
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

    const update = (input: InferInput<typeof OrderUpdateSchema>) =>
      Effect.gen(function* (_) {
        const parsedId = safeParse(prefixed_cuid2, input.id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id: input.id }));
        }

        const [updated] = yield* Effect.promise(() =>
          db
            .update(TB_orders)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(TB_orders.id, parsedId.output))
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
          db.delete(TB_orders).where(eq(TB_orders.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new OrderNotDeleted({ id }));
        }

        return deleted;
      });

    const findByUserId = (userId: string, relations: FindManyParams["with"] = withRelations()) =>
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
                  custSched: {
                    with: {
                      schedule: true,
                    },
                  },
                  prods: {
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
          db.update(TB_orders).set({ deletedAt: new Date() }).where(eq(TB_orders.id, parsedId.output)).returning(),
        );

        if (!deleted) {
          return yield* Effect.fail(new OrderNotCreated({ message: "Failed to safe remove order" }));
        }

        return deleted;
      });

    const all = (relations: FindManyParams["with"] = withRelations()) =>
      Effect.gen(function* (_) {
        return yield* Effect.promise(() => db.query.TB_orders.findMany({ with: relations }));
      });

    const findCustomerOrdersByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        const orgOrders = yield* Effect.promise(() =>
          db.query.TB_organizations_customerorders.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, parsedOrganizationId.output),
            with: {
              order: {
                with: {
                  custSched: {
                    with: {
                      schedule: true,
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
                  prods: {
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
        return orgOrders.map((o) => o.order);
      });

    const findSupplierOrdersByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }
        const orgOrders = yield* Effect.promise(() =>
          db.query.TB_organizations_supplierorders.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, parsedOrganizationId.output),
            with: {
              order: {
                with: {
                  custSched: {
                    with: {
                      schedule: true,
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
                  prods: {
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
        return orgOrders.map((o) => o.order);
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
              orderCount: sql<number>`count(distinct ${TB_orders.id})`,
              totalQuantity: sql<number>`sum(${TB_order_products.quantity})`,
            })
            .from(TB_organizations_customerorders)
            .innerJoin(TB_orders, eq(TB_organizations_customerorders.order_id, TB_orders.id))
            .innerJoin(TB_order_products, eq(TB_orders.id, TB_order_products.orderId))
            .innerJoin(TB_products, eq(TB_order_products.productId, TB_products.id))
            .where(eq(TB_organizations_customerorders.organization_id, parsedOrganizationId.output))
            .groupBy(TB_products.id)
            .orderBy(sql`count(distinct ${TB_orders.id}) desc, sum(${TB_order_products.quantity}) desc`)
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
            TB_organizations_customerorders,
            and(
              eq(TB_organizations_customerorders.organization_id, parsedOrganizationId.output),
              gte(TB_organizations_customerorders.createdAt, twoWeeksAgo),
              lt(TB_organizations_customerorders.createdAt, aWeekAgo),
            ),
          ),
        );

        const fromAWeekToTodayData = yield* Effect.promise(() =>
          db.$count(
            TB_organizations_customerorders,
            and(
              eq(TB_organizations_customerorders.organization_id, parsedOrganizationId.output),
              gte(TB_organizations_customerorders.createdAt, aWeekAgo),
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

    const percentageSupplierOrdersLastWeekByOrganizationId = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrganizationId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrganizationId.success) {
          return yield* Effect.fail(new OrganizationInvalidId({ id: organizationId }));
        }

        const twoWeeksAgo = dayjs().subtract(14, "day").toDate();
        const aWeekAgo = dayjs().subtract(7, "day").toDate();
        const from2WeeksToAWeekAgoData = yield* Effect.promise(() =>
          db.$count(
            TB_organizations_customerorders,
            and(
              eq(TB_organizations_customerorders.organization_id, parsedOrganizationId.output),
              gte(TB_organizations_customerorders.createdAt, twoWeeksAgo),
              lt(TB_organizations_customerorders.createdAt, aWeekAgo),
            ),
          ),
        );

        const fromAWeekToTodayData = yield* Effect.promise(() =>
          db.$count(
            TB_organizations_supplierorders,
            and(
              eq(TB_organizations_supplierorders.organization_id, parsedOrganizationId.output),
              gte(TB_organizations_supplierorders.createdAt, aWeekAgo),
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
              month: sql<string>`date_trunc('month', ${TB_organizations_customerorders.createdAt})`,
              // Count total orders per month
              count: sql<number>`count(*)`,
            })
            .from(TB_organizations_customerorders)
            .where(
              and(
                eq(TB_organizations_customerorders.organization_id, parsedOrganizationId.output),
                // Only get orders from last 6 months
                gte(TB_organizations_customerorders.createdAt, sixMonthsAgo.toDate()),
              ),
            )
            // Group by month to get monthly totals
            .groupBy(sql`date_trunc('month', ${TB_organizations_customerorders.createdAt})`)
            // Order by month ascending
            .orderBy(sql`date_trunc('month', ${TB_organizations_customerorders.createdAt})`),
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

    const getSupplierOrdersChartData = (organizationId: string) =>
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
              month: sql<string>`date_trunc('month', ${TB_organizations_supplierorders.createdAt})`,
              // Count total orders per month
              count: sql<number>`count(*)`,
            })
            .from(TB_organizations_supplierorders)
            .where(
              and(
                eq(TB_organizations_supplierorders.organization_id, parsedOrganizationId.output),
                // Only get orders from last 6 months
                gte(TB_organizations_supplierorders.createdAt, sixMonthsAgo.toDate()),
              ),
            )
            // Group by month to get monthly totals
            .groupBy(sql`date_trunc('month', ${TB_organizations_supplierorders.createdAt})`)
            // Order by month ascending
            .orderBy(sql`date_trunc('month', ${TB_organizations_supplierorders.createdAt})`),
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
              count: sql<number>`count(distinct ${TB_orders.id})`,
            })
            .from(TB_organizations_customerorders)
            // Join orders and products through order_products junction table
            .innerJoin(TB_orders, eq(TB_organizations_customerorders.order_id, TB_orders.id))
            .innerJoin(TB_order_products, eq(TB_orders.id, TB_order_products.orderId))
            .innerJoin(TB_products, eq(TB_order_products.productId, TB_products.id))
            .where(eq(TB_organizations_customerorders.organization_id, parsedOrganizationId.output))
            .groupBy(TB_products.id)
            // Order by order count descending to get most popular first
            .orderBy(sql`count(distinct ${TB_orders.id}) desc`)
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
              date: sql<string>`date_trunc('day', ${TB_organizations_customerorders.createdAt})`,
              // Sum quantities sold per day
              count: sql<number>`sum(${TB_order_products.quantity})`,
            })
            .from(TB_organizations_customerorders)
            // Join orders and products through order_products junction table
            .innerJoin(TB_orders, eq(TB_organizations_customerorders.order_id, TB_orders.id))
            .innerJoin(TB_order_products, eq(TB_orders.id, TB_order_products.orderId))
            .where(
              and(
                eq(TB_organizations_customerorders.organization_id, parsedOrganizationId.output),
                // Only get sales from last 30 days
                gte(TB_organizations_customerorders.createdAt, thirtyDaysAgo.toDate()),
              ),
            )
            // Group by day to get daily totals
            .groupBy(sql`date_trunc('day', ${TB_organizations_customerorders.createdAt})`)
            // Order by day ascending
            .orderBy(sql`date_trunc('day', ${TB_organizations_customerorders.createdAt})`),
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

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByUserId,
      findCustomerOrdersByOrganizationId,
      findSupplierOrdersByOrganizationId,
      findMostPopularProductsByOrganizationId,
      percentageCustomerOrdersLastWeekByOrganizationId,
      percentageSupplierOrdersLastWeekByOrganizationId,
      all,
      getCustomerOrdersChartData,
      getSupplierOrdersChartData,
      getPopularProductsChartData,
      getLastSoldProductsChartData,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const OrderLive = OrderService.Default;

// Type exports
export type OrderInfo = NonNullable<Awaited<Effect.Effect.Success<ReturnType<OrderService["findById"]>>>>;
