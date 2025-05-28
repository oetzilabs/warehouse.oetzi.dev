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
  amounts: FinancialAmount[]; // Changed from single amount to array of amounts
  productAmounts: number;
  type: "income" | "expense";
  description: string;
}

export interface FinancialSummary {
  totalsByCurrency: Record<
    string,
    {
      income: number;
      expenses: number;
      netIncome: number;
      uniqueProductsIncome: number; // number of unique products sold
      uniqueProductsExpenses: number; // number of unique products purchased
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
        const supplierOrders = yield* Effect.promise(() =>
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

        const transactions: FinancialTransaction[] = ([] as FinancialTransaction[])
          .concat(
            supplierOrders
              .sort((a, b) => b.order.createdAt.getTime() - a.order.createdAt.getTime())
              .map((so) => ({
                date: so.order.createdAt,
                productAmounts: so.order.prods.reduce((acc, prod) => acc + prod.quantity, 0),
                amounts: Array.from(
                  so.order.prods
                    .filter((prod) => prod.product.purchasePrice !== null && prod.product.currency !== null)
                    .reduce((acc, prod) => {
                      const price = prod.product.purchasePrice!;
                      const currency = prod.product.currency!;
                      const existingAmount = acc.get(currency);

                      if (existingAmount) {
                        acc.set(currency, price * prod.quantity + existingAmount);
                      } else {
                        acc.set(currency, price * prod.quantity);
                      }
                      return acc;
                    }, new Map<string, number>())
                    // Convert the Map entries back to the FinancialAmount[] format
                    .entries(),
                ).map(([currency, amount]) => ({ currency, amount }) as FinancialAmount),
                type: "expense" as const,
                description: `Supplier Order: ${so.order.id}`,
              })),
          )
          .concat(
            sales
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .map((s) => {
                const itemsByCurrency = s.items.reduce(
                  (acc, item) => {
                    if (!acc[item.currency]) acc[item.currency] = [];
                    acc[item.currency].push(item);
                    return acc;
                  },
                  {} as Record<string, typeof s.items>,
                );

                return {
                  date: s.createdAt,
                  productAmounts: Object.values(itemsByCurrency).reduce(
                    (acc, items) => acc + items.reduce((total, item) => total + item.quantity, 0),
                    0,
                  ),
                  amounts: Object.entries(itemsByCurrency).map(([currency, items]) => ({
                    currency,
                    amount: items.reduce((total, item) => total + item.price * item.quantity, 0),
                  })),
                  type: "income" as const,
                  description: `Sale: ${s.id}`,
                };
              }),
          );

        // Calculate totals by currency
        const totalsByCurrency = transactions.reduce(
          (acc, t) => {
            // Track unique products for each currency
            const uniqueProducts = new Set<string>();

            t.amounts.forEach(({ currency, amount }) => {
              if (!acc[currency]) {
                acc[currency] = {
                  income: 0,
                  expenses: 0,
                  netIncome: 0,
                  uniqueProductsIncome: 0,
                  uniqueProductsExpenses: 0,
                };
              }

              if (t.type === "income") {
                acc[currency].income += amount;
                // For sales transactions
                if (t.description.startsWith("Sale:")) {
                  const saleId = t.description.split(":")[1].trim();
                  const sale = sales.find((s) => s.id === saleId);
                  const saleProducts = sale?.items.filter((i) => i.currency === currency).map((i) => i.productId) ?? [];
                  saleProducts.forEach((p) => uniqueProducts.add(p));
                }
              } else {
                acc[currency].expenses += amount;
                // For supplier orders
                if (t.description.startsWith("Supplier Order:")) {
                  const orderId = t.description.split(":")[1].trim();
                  const order = supplierOrders.find((so) => so.order.id === orderId);
                  const orderProducts =
                    order?.order.prods.filter((p) => p.product.currency === currency).map((p) => p.productId) ?? [];
                  orderProducts.forEach((p) => uniqueProducts.add(p));
                }
              }

              acc[currency].netIncome = acc[currency].income - acc[currency].expenses;
              if (t.type === "income") {
                acc[currency].uniqueProductsIncome = uniqueProducts.size;
              } else {
                acc[currency].uniqueProductsExpenses = uniqueProducts.size;
              }
            });
            return acc;
          },
          {} as Record<
            string,
            {
              income: number;
              expenses: number;
              netIncome: number;
              uniqueProductsIncome: number;
              uniqueProductsExpenses: number;
            }
          >,
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
