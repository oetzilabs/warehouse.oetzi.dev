import dayjs from "dayjs";
import { and, gte, lte } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
import { OrganizationId } from "../organizations/id";
import { AccountingDateRangeInvalid, AccountingOrganizationInvalidId } from "./errors";

export interface FinancialAmount {
  amount: number;
  currency: string;
}

export interface FinancialTransaction {
  date: Date;
  amounts: {
    currency: string;
    bought: number;
    sold: number;
    stornosBought: number; // Amount of cancelled purchases
    stornosSold: number; // Amount of cancelled sales
  }[];
  productAmounts: {
    bought: number;
    sold: number;
    stornosBought: number; // Number of products from cancelled purchases
    stornosSold: number; // Number of products from cancelled sales
  };
  type: "income" | "expense" | "mixed";
  description: string;
}

export interface FinancialSummary {
  totalsByCurrency: Record<
    string,
    {
      income: number;
      expenses: number;
      netIncome: number;
      uniqueProductsIncome: number;
      uniqueProductsExpenses: number;
      stornos: {
        income: number; // Total amount of cancelled sales
        expenses: number; // Total amount of cancelled purchases
      };
    }
  >;
  transactions: FinancialTransaction[];
}

export class AccountingService extends Effect.Service<AccountingService>()("@warehouse/accounting", {
  effect: Effect.gen(function* (_) {
    const database = yield* _(DatabaseService);
    const db = yield* database.instance;

    const getFinancialSummary = () =>
      Effect.gen(function* (_) {
        const orgId = yield* OrganizationId;

        // Get supplier orders (expenses)
        const purchases = yield* Effect.promise(() =>
          db.query.TB_supplier_purchases.findMany({
            where: (fields, operations) => operations.eq(fields.organization_id, orgId),
            with: {
              supplier: true,
              products: {
                with: {
                  product: {
                    with: {
                      labels: true,
                      brands: true,
                      suppliers: {
                        with: {
                          priceHistory: true,
                        },
                      },
                      organizations: {
                        with: {
                          priceHistory: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        );

        // Get sales directly with a single query
        const sales = yield* Effect.promise(() =>
          db.query.TB_sales.findMany({
            where: (fields, operations) => operations.eq(fields.organizationId, orgId),
            with: {
              items: {
                with: {
                  product: {
                    with: {
                      labels: true,
                      brands: true,
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
                    },
                  },
                },
              },
              customer: true,
              discounts: {
                with: {
                  discount: true,
                },
              },
            },
          }),
        );

        // Group transactions by date
        const transactionsByDay = new Map<
          string,
          {
            sales: typeof sales;
            orders: typeof purchases;
          }
        >();

        // Group sales by day
        sales.forEach((sale) => {
          const day = dayjs(sale.createdAt).format("YYYY-MM-DD");
          if (!transactionsByDay.has(day)) {
            transactionsByDay.set(day, { sales: [], orders: [] });
          }
          transactionsByDay.get(day)!.sales.push(sale);
        });

        // Group supplier orders by day
        purchases.forEach((order) => {
          const day = dayjs(order.createdAt).format("YYYY-MM-DD");
          if (!transactionsByDay.has(day)) {
            transactionsByDay.set(day, { sales: [], orders: [] });
          }
          transactionsByDay.get(day)!.orders.push(order);
        });

        const transactions: FinancialTransaction[] = Array.from(transactionsByDay.entries())
          .map(([day, { sales, orders }]) => {
            const currencyMap = new Map<
              string,
              { bought: number; sold: number; stornosBought: number; stornosSold: number }
            >();
            let totalProductsBought = 0;
            let totalProductsSold = 0;
            let totalProductsStornoBought = 0;
            let totalProductsStornoSold = 0;

            // Process orders (bought)
            orders
              .filter((s) => s.status === "completed")
              .forEach((so) => {
                so.products.forEach((prod) => {
                  // Find the relevant price from priceHistory that was active at the time of the order
                  const orderDate = so.createdAt;
                  const orgPriceHistory = prod.product.suppliers
                    .find((org) => org.supplierId === so.supplier_id)
                    ?.priceHistory.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());

                  if (orgPriceHistory && orgPriceHistory.length > 0) {
                    const applicablePrice =
                      orgPriceHistory.find((ph) => ph.effectiveDate <= orderDate) ??
                      orgPriceHistory[orgPriceHistory.length - 1];

                    const currency = applicablePrice.currency;
                    if (!currencyMap.has(currency)) {
                      currencyMap.set(currency, { bought: 0, sold: 0, stornosBought: 0, stornosSold: 0 });
                    }

                    const amount = applicablePrice.supplierPrice * Math.abs(prod.quantity);
                    if (prod.quantity < 0) {
                      currencyMap.get(currency)!.stornosBought += amount;
                      totalProductsStornoBought += Math.abs(prod.quantity);
                    } else {
                      currencyMap.get(currency)!.bought += amount;
                      totalProductsBought += prod.quantity;
                    }
                  }
                });
              });

            // Process sales (sold)
            sales
              .filter((s) => s.status === "confirmed")
              .forEach((sale) => {
                sale.items.forEach((item) => {
                  // Find the relevant price from priceHistory that was active at the time of the sale
                  const saleDate = sale.createdAt;
                  const orgPriceHistory = item.product.organizations
                    .find((org) => org.organizationId === orgId)
                    ?.priceHistory.sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());

                  if (orgPriceHistory && orgPriceHistory.length > 0) {
                    const applicablePrice =
                      orgPriceHistory.find((ph) => ph.effectiveDate <= saleDate) ??
                      orgPriceHistory[orgPriceHistory.length - 1];

                    const currency = applicablePrice.currency;
                    if (!currencyMap.has(currency)) {
                      currencyMap.set(currency, { bought: 0, sold: 0, stornosBought: 0, stornosSold: 0 });
                    }

                    const amount = item.price * Math.abs(item.quantity);
                    if (item.quantity < 0) {
                      currencyMap.get(currency)!.stornosSold += amount;
                      totalProductsStornoSold += Math.abs(item.quantity);
                    } else {
                      currencyMap.get(currency)!.sold += amount;
                      totalProductsSold += item.quantity;
                    }
                  }
                });
              });

            const type: FinancialTransaction["type"] =
              sales.filter((s) => s.status === "confirmed").length > 0 &&
              orders.filter((s) => s.status === "completed").length > 0
                ? "mixed"
                : sales.filter((s) => s.status === "confirmed").length > 0
                  ? "income"
                  : "expense";

            return {
              date: new Date(day),
              amounts: Array.from(currencyMap.entries()).map(([currency, amounts]) => ({
                currency,
                bought: amounts.bought,
                sold: amounts.sold,
                stornosBought: amounts.stornosBought,
                stornosSold: amounts.stornosSold,
              })),
              productAmounts: {
                bought: totalProductsBought,
                sold: totalProductsSold,
                stornosBought: totalProductsStornoBought,
                stornosSold: totalProductsStornoSold,
              },
              type,
              description: `Daily summary for ${day}`,
            };
          })
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        // Update totals calculation
        const totalsByCurrency = transactions.reduce(
          (acc, t) => {
            t.amounts.forEach(({ currency, bought, sold, stornosBought, stornosSold }) => {
              if (!acc[currency]) {
                acc[currency] = {
                  income: 0,
                  expenses: 0,
                  netIncome: 0,
                  uniqueProductsIncome: 0,
                  uniqueProductsExpenses: 0,
                  stornos: { income: 0, expenses: 0 },
                };
              }
              acc[currency].income += sold;
              acc[currency].expenses += bought;
              acc[currency].stornos.income += stornosSold;
              acc[currency].stornos.expenses += stornosBought;
              acc[currency].netIncome =
                acc[currency].income -
                acc[currency].stornos.income -
                (acc[currency].expenses - acc[currency].stornos.expenses);
            });
            return acc;
          },
          {} as FinancialSummary["totalsByCurrency"],
        );

        return {
          totalsByCurrency,
          transactions: transactions.sort((a, b) => b.date.getTime() - a.date.getTime()),
        } satisfies FinancialSummary;
      });

    return {
      getFinancialSummary,
    } as const;
  }),
  dependencies: [DatabaseLive],
}) {}

export const AccountingLive = AccountingService.Default;

export type AccountingInfo = NonNullable<
  Awaited<Effect.Effect.Success<ReturnType<AccountingService["getFinancialSummary"]>>>
>;
