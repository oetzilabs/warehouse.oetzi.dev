import cuid2 from "@paralleldrive/cuid2";
import dayjs from "dayjs";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { Console, Effect } from "effect";
import { safeParse, type InferInput } from "valibot";
import {
  CustomerOrderCreateSchema,
  CustomerOrderSelect,
  CustomerOrderUpdateSchema,
  SaleItemCreate,
  TB_customer_order_products,
  TB_customer_orders,
  TB_organization_product_price_history,
  TB_organizations_products,
  TB_organizations_sales,
  TB_products,
  TB_sale_items,
  TB_sales,
  TB_supplier_purchases,
} from "../../drizzle/sql/schema";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { CustomerInvalidId } from "../customers/errors";
import { InventoryLive, InventoryService } from "../inventory";
import { OrganizationInfo } from "../organizations";
import { OrganizationInvalidId } from "../organizations/errors";
import { OrganizationId } from "../organizations/id";
import { PaperOrientation, PaperSize, PDFLive, PDFService } from "../pdf";
import { CreatedSale, SaleProduct } from "../sales";
import { SaleConversionFailed, SaleNotCreated } from "../sales/errors";
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
    const db = yield* DatabaseService;

    const create = Effect.fn("@warehouse/customer-orders/create")(function* (
      userInput: InferInput<typeof CustomerOrderCreateSchema>,
      products: {
        product_id: string;
        quantity: number;
      }[],
    ) {
      const orgId = yield* OrganizationId;
      const r = yield* Effect.async<CustomerOrderSelect, OrderNotCreated>((resume) => {
        db.transaction(async (tx) => {
          try {
            const [order] = await tx
              .insert(TB_customer_orders)
              .values({ ...userInput, organization_id: orgId })
              .returning();

            if (!order) throw new Error("Failed to create order");

            const productsToInsert = products.map((p) => ({
              customerOrderId: order.id,
              productId: p.product_id,
              quantity: p.quantity,
            }));

            await tx.insert(TB_customer_order_products).values(productsToInsert).returning();

            resume(Effect.succeed(order));
          } catch (error) {
            resume(
              Effect.fail(
                new OrderNotCreated({
                  message: error instanceof Error ? error.message : "Unknown error during order creation",
                }),
              ),
            );
            return tx.rollback();
          }
        });
      });
      return r;
    });

    const findById = Effect.fn("@warehouse/customer-orders/findById")(
      function* (id: string) {
        const inventoryService = yield* InventoryService;
        const parsedId = safeParse(prefixed_cuid2, id);
        if (!parsedId.success) {
          return yield* Effect.fail(new OrderInvalidId({ id }));
        }

        const orgId = yield* OrganizationId;

        const order = yield* db.query.TB_customer_orders.findFirst({
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
        });

        if (!order) {
          return yield* Effect.fail(new OrderNotFound({ id }));
        }

        // Filter organizations and get org-specific product data
        const filteredOrder = {
          ...order,
          products: order.products.map((p) => ({
            ...p,
            product: {
              ...p.product,
              organizations: p.product.organizations.filter((org) => org.organizationId === orgId),
              priceHistory:
                p.product.organizations
                  .find((o) => o.organizationId === orgId)
                  ?.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime()) || [],
              currency: p.product.organizations
                .find((org) => org.organizationId === orgId)!
                .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].currency,
              sellingPrice: p.product.organizations
                .find((org) => org.organizationId === orgId)!
                .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].sellingPrice,
            },
          })),
        };

        const productStocks = yield* inventoryService.getStockForProducts(
          filteredOrder.products.map((p) => p.productId),
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
      },
      (effect) => effect.pipe(Effect.provide(InventoryLive)),
    );

    const update = Effect.fn("@warehouse/customer-orders/update")(function* (
      input: InferInput<typeof CustomerOrderUpdateSchema>,
    ) {
      const parsedId = safeParse(prefixed_cuid2, input.id);
      if (!parsedId.success) {
        return yield* Effect.fail(new OrderInvalidId({ id: input.id }));
      }

      const [updated] = yield* db
        .update(TB_customer_orders)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(TB_customer_orders.id, parsedId.output))
        .returning();

      if (!updated) {
        return yield* Effect.fail(new OrderNotUpdated({ id: input.id }));
      }

      return updated;
    });

    const remove = Effect.fn("@warehouse/customer-orders/remove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new OrderInvalidId({ id }));
      }

      const [deleted] = yield* db
        .delete(TB_customer_orders)
        .where(eq(TB_customer_orders.id, parsedId.output))
        .returning();

      if (!deleted) {
        return yield* Effect.fail(new OrderNotDeleted({ id }));
      }

      return deleted;
    });

    const findByUserId = Effect.fn("@warehouse/customer-orders/findByUserId")(function* (userId: string) {
      const parsedUserId = safeParse(prefixed_cuid2, userId);
      if (!parsedUserId.success) {
        return yield* Effect.fail(new OrderUserInvalidId({ userId }));
      }

      return yield* db.query.TB_user_orders.findMany({
        where: (fields, operations) => operations.eq(fields.userId, parsedUserId.output),
        with: {
          order: {
            with: {
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
          },
        },
      });
    });

    const safeRemove = Effect.fn("@warehouse/customer-orders/safeRemove")(function* (id: string) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new OrderInvalidId({ id }));
      }

      const [deleted] = yield* db
        .update(TB_customer_orders)
        .set({ deletedAt: new Date() })
        .where(eq(TB_customer_orders.id, parsedId.output))
        .returning();

      if (!deleted) {
        return yield* Effect.fail(new OrderNotCreated({ message: "Failed to safe remove order" }));
      }

      return deleted;
    });

    const all = Effect.fn("@warehouse/customer-orders/all")(function* () {
      return yield* db.query.TB_customer_orders.findMany({
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
      });
    });

    const findByOrganizationId = Effect.fn("@warehouse/customer-orders/findByOrganizationId")(function* () {
      const orgId = yield* OrganizationId;

      const orders = yield* db.query.TB_customer_orders.findMany({
        orderBy: (fields, operators) => [operators.desc(fields.createdAt), operators.desc(fields.updatedAt)],
        where: (fields, operations) => operations.eq(fields.organization_id, orgId),
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
      });

      // Filter organizations for each product
      const filteredOrders = orders.map((order) => ({
        ...order,
        products: order.products.map((p) => ({
          ...p,
          product: {
            ...p.product,
            organizations: p.product.organizations.filter((org) => org.organizationId === orgId),
            currency: p.product.organizations
              .find((org) => org.organizationId === orgId)!
              .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].currency,
            sellingPrice: p.product.organizations
              .find((org) => org.organizationId === orgId)!
              .priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0].sellingPrice,
          },
        })),
      }));

      return filteredOrders;
    });

    const findMostPopularProducts = Effect.fn("@warehouse/customer-orders/findMostPopularProducts")(function* () {
      const orgId = yield* OrganizationId;

      return yield* db
        .select({
          product: {
            id: TB_products.id,
            name: TB_products.name,
            sku: TB_products.sku,
            description: TB_products.description,
            status: TB_organizations_products.status,
          },
          // Get latest price from price history
          latestPrice: sql<{
            sellingPrice: number;
            currency: string;
          }>`(
                SELECT json_build_object(
                  'sellingPrice', ph.selling_price,
                  'currency', ph.currency
                )
                FROM ${TB_organization_product_price_history} ph
                WHERE ph.organization_id = ${TB_organizations_products.organizationId}
                AND ph.product_id = ${TB_organizations_products.productId}
                ORDER BY ph.effective_date DESC
                LIMIT 1
              )`,
          orderCount: sql<number>`count(distinct ${TB_customer_orders.id})`,
          totalQuantity: sql<number>`sum(${TB_customer_order_products.quantity})`,
        })
        .from(TB_customer_orders)
        .innerJoin(TB_customer_order_products, eq(TB_customer_orders.id, TB_customer_order_products.customerOrderId))
        .innerJoin(TB_products, eq(TB_customer_order_products.productId, TB_products.id))
        .innerJoin(
          TB_organizations_products,
          and(
            eq(TB_organizations_products.productId, TB_products.id),
            eq(TB_organizations_products.organizationId, orgId),
          ),
        )
        .where(eq(TB_customer_orders.organization_id, orgId))
        .groupBy(
          TB_products.id,
          TB_products.name,
          TB_products.sku,
          TB_products.description,
          TB_organizations_products.status,
          TB_organizations_products.organizationId,
          TB_organizations_products.productId,
        )
        .orderBy(sql`count(distinct ${TB_customer_orders.id}) desc, sum(${TB_customer_order_products.quantity}) desc`)
        .limit(3);
    });

    const percentageCustomerOrdersLastWeek = Effect.fn("@warehouse/customer-orders/percentageCustomerOrdersLastWeek")(
      function* () {
        const orgId = yield* OrganizationId;

        const twoWeeksAgo = dayjs().subtract(14, "day").toDate();
        const aWeekAgo = dayjs().subtract(7, "day").toDate();
        const from2WeeksToAWeekAgoData = yield* Effect.promise(() =>
          db.$count(
            TB_customer_orders,
            and(
              eq(TB_customer_orders.organization_id, orgId),
              gte(TB_customer_orders.createdAt, twoWeeksAgo),
              lt(TB_customer_orders.createdAt, aWeekAgo),
            ),
          ),
        );

        const fromAWeekToTodayData = yield* Effect.promise(() =>
          db.$count(
            TB_customer_orders,
            and(eq(TB_customer_orders.organization_id, orgId), gte(TB_customer_orders.createdAt, aWeekAgo)),
          ),
        );

        if (from2WeeksToAWeekAgoData === 0) {
          return 0;
        }

        const delta = from2WeeksToAWeekAgoData - fromAWeekToTodayData;

        const percentage = Math.round((delta / from2WeeksToAWeekAgoData) * 100);

        return percentage;
      },
    );

    const convertToSale = Effect.fn("@warehouse/customer-orders/convertToSale")(function* (
      id: string,
      cid: string,
      products: Array<{ id: string; quantity: number }>,
    ) {
      const parsedId = safeParse(prefixed_cuid2, id);
      if (!parsedId.success) {
        return yield* Effect.fail(new OrderInvalidId({ id }));
      }
      const parsedCid = safeParse(prefixed_cuid2, cid);
      if (!parsedCid.success) {
        return yield* Effect.fail(new CustomerInvalidId({ id: cid }));
      }
      const orgId = yield* OrganizationId;

      const order = yield* findById(id);

      const itemsFromOrder = order.products.map((p) => {
        const orgProduct = p.product.organizations[0];
        return {
          currency: orgProduct.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0]
            .currency,
          quantity: products.find((po) => po.id === p.product.id)!.quantity ?? p.quantity,
          productId: p.product.id,
          price: orgProduct.priceHistory.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())[0]
            .sellingPrice,
        } satisfies Omit<SaleItemCreate, "saleId">;
      });

      const result = yield* Effect.async<{ sale: CreatedSale; items: SaleProduct[] }, SaleConversionFailed>(
        (resume) => {
          db.transaction(async (tx) => {
            try {
              // Create barcode
              const barcode = `sale-${cuid2.createId()}`;

              // Insert sale
              const [sale] = await tx
                .insert(TB_sales)
                .values({
                  customerId: cid,
                  organizationId: orgId,
                  status: "created",
                  barcode,
                })
                .returning();

              if (!sale) throw new Error("Failed to create sale");

              // Insert sale items
              const items = await tx
                .insert(TB_sale_items)
                .values(itemsFromOrder.map((i) => ({ ...i, saleId: sale.id })))
                .returning();

              // Update order status
              await tx
                .update(TB_customer_orders)
                .set({ saleId: sale.id, status: "processing", updatedAt: new Date() })
                .where(eq(TB_customer_orders.id, id))
                .returning();

              // Create organization-sale relation
              await tx
                .insert(TB_organizations_sales)
                .values({
                  organizationId: orgId,
                  saleId: sale.id,
                })
                .returning();

              resume(Effect.succeed({ sale, items }));
            } catch (error) {
              resume(
                Effect.fail(
                  new SaleConversionFailed({
                    message: error instanceof Error ? error.message : "Unknown error during sale conversion",
                  }),
                ),
              );
              return tx.rollback();
            }
          });
        },
      );

      if (!result.sale) {
        return yield* Effect.fail(new SaleNotCreated());
      }

      return result;
    });

    const generatePDF = Effect.fn("@warehouse/customer-orders/generatePDF")(
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
        const pdfGenService = yield* PDFService;
        const order = yield* findById(id);
        const generatedPdf = yield* Effect.suspend(() =>
          pdfGenService.order(order, organization, {
            page: options.page,
          }),
        );
        return generatedPdf;
      },
      (effect) => effect.pipe(Effect.provide(PDFLive)),
    );

    const percentageSupplierPurchasesLastWeek = Effect.fn(
      "@warehouse/customer-orders/percentageSupplierPurchasesLastWeek",
    )(function* () {
      const orgId = yield* OrganizationId;

      const twoWeeksAgo = dayjs().subtract(14, "day").toDate();
      const aWeekAgo = dayjs().subtract(7, "day").toDate();
      const from2WeeksToAWeekAgoData = yield* Effect.promise(() =>
        db.$count(
          TB_supplier_purchases,
          and(
            eq(TB_supplier_purchases.organization_id, orgId),
            gte(TB_supplier_purchases.createdAt, twoWeeksAgo),
            lt(TB_supplier_purchases.createdAt, aWeekAgo),
          ),
        ),
      );

      const fromAWeekToTodayData = yield* Effect.promise(() =>
        db.$count(
          TB_supplier_purchases,
          and(eq(TB_supplier_purchases.organization_id, orgId), gte(TB_supplier_purchases.createdAt, aWeekAgo)),
        ),
      );
      if (from2WeeksToAWeekAgoData === 0) {
        return 0;
      }
      const delta = from2WeeksToAWeekAgoData - fromAWeekToTodayData;

      const percentage = Math.round((delta / from2WeeksToAWeekAgoData) * 100);

      return percentage;
    });

    const findSupplierPurchases = Effect.fn("@warehouse/customer-orders/findSupplierPurchases")(function* () {
      const orgId = yield* OrganizationId;
      const orgPurchases = yield* db.query.TB_supplier_purchases.findMany({
        where: (fields, operations) => operations.eq(fields.organization_id, orgId),
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
      });
      return orgPurchases;
    });

    return {
      create,
      findById,
      update,
      remove,
      safeRemove,
      findByUserId,
      findByOrganizationId,
      findSupplierPurchases,
      findMostPopularProducts,
      percentageCustomerOrdersLastWeek,
      percentageSupplierPurchasesLastWeek,
      all,
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
export type CustomerOrderByOrganizationIdInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<CustomerOrderService["findByOrganizationId"]>>>
>[number];
