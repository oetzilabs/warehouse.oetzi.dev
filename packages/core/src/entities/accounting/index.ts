import dayjs from "dayjs";
import { and, gte, lte } from "drizzle-orm";
import { Effect } from "effect";
import { safeParse } from "valibot";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql";
import { TB_organizations_sales, TB_organizations_supplierorders } from "../../drizzle/sql/schema";
import { prefixed_cuid2 } from "../../utils/custom-cuid2-valibot";
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

    const getFinancialSummary = (organizationId: string) =>
      Effect.gen(function* (_) {
        const parsedOrgId = safeParse(prefixed_cuid2, organizationId);
        if (!parsedOrgId.success) {
          return yield* Effect.fail(new AccountingOrganizationInvalidId({ organizationId }));
        }

        // Get supplier orders (expenses)
        const purchases = yield* Effect.promise(() =>
          db.query.TB_organizations_supplierorders.findMany({
            where: (fields, operations) => and(operations.eq(fields.organization_id, parsedOrgId.output)),
            with: {
              order: {
                with: {
                  prods: {
                    with: {
                      product: true,
                    },
                  },
                },
              },
            },
          }),
        );

        // Get sales (income)
        const orgSales = yield* Effect.promise(() =>
          db.query.TB_organizations_sales.findMany({
            where: (fields, operations) => operations.eq(fields.organizationId, parsedOrgId.output),
          }),
        );
        const salesId = orgSales.map((s) => s.saleId);

        const sales = yield* Effect.promise(() =>
          db.query.TB_sales.findMany({
            where: (fields, operations) => operations.and(operations.inArray(fields.id, salesId)),
            with: { items: { with: { product: true } } },
            orderBy: (fields, operations) => [operations.desc(fields.createdAt)],
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
          const day = dayjs(order.order.createdAt).format("YYYY-MM-DD");
          if (!transactionsByDay.has(day)) {
            transactionsByDay.set(day, { sales: [], orders: [] });
          }
          transactionsByDay.get(day)!.orders.push(order);
        });

        const transactions: FinancialTransaction[] = Array.from(transactionsByDay.entries())
          .map(([day, { sales, orders }]) => {
            // Process transactions
            const currencyMap = new Map<
              string,
              { bought: number; sold: number; stornosBought: number; stornosSold: number }
            >();
            let totalProductsBought = 0;
            let totalProductsSold = 0;
            let totalProductsStornoBought = 0;
            let totalProductsStornoSold = 0;

            // Process orders (bought)
            orders.forEach((so) => {
              so.order.prods.forEach((prod) => {
                if (prod.product.purchasePrice && prod.product.currency) {
                  const currency = prod.product.currency;
                  if (!currencyMap.has(currency)) {
                    currencyMap.set(currency, { bought: 0, sold: 0, stornosBought: 0, stornosSold: 0 });
                  }
                  const amount = prod.product.purchasePrice * Math.abs(prod.quantity);
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
            sales.forEach((sale) => {
              sale.items.forEach((item) => {
                if (!currencyMap.has(item.currency)) {
                  currencyMap.set(item.currency, { bought: 0, sold: 0, stornosBought: 0, stornosSold: 0 });
                }
                const amount = item.price * Math.abs(item.quantity);
                if (item.quantity < 0) {
                  currencyMap.get(item.currency)!.stornosSold += amount;
                  totalProductsStornoSold += Math.abs(item.quantity);
                } else {
                  currencyMap.get(item.currency)!.sold += amount;
                  totalProductsSold += item.quantity;
                }
              });
            });

            const type: FinancialTransaction["type"] =
              sales.length > 0 && orders.length > 0 ? "mixed" : sales.length > 0 ? "income" : "expense";

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
