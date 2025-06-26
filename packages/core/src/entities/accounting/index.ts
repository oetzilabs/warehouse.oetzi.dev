// --- Service Implementation ---

import dayjs from "dayjs";
import { Effect, Schema } from "effect";
import { DatabaseLive, DatabaseService } from "../../drizzle/sql/service";
import { OrganizationId } from "../organizations/id";

// --- Unified Accounting Types ---

export type AccountingTransactionType = "income" | "expense" | "mixed";

export interface FinancialAmount {
  amount: number;
  currency: string;
  metadata?: any;
}

export interface FinancialTransactionAmount {
  value: FinancialAmount;
  category: string;
  date: Date;
  type: AccountingTransactionType;
  metadata: any;
}

export interface FinancialTransaction {
  id: string;
  date: Date;
  amounts: FinancialTransactionAmount[];
  description: string;
  category: string;
  type: AccountingTransactionType;
  metadata: any;
}

export interface AccountingCurrencyTotalsEntry {
  incomes: FinancialTransactionAmount[];
  expenses: FinancialTransactionAmount[];
  netIncome: number;
  uniqueProductsIncome: number;
  uniqueProductsExpenses: number;
  stornos: {
    income: number;
    expenses: number;
  };
}

export type AccountingTotalsByCurrency = Record<string, AccountingCurrencyTotalsEntry>;

export interface FinancialSummary {
  totalsByCurrency: AccountingTotalsByCurrency;
  transactions: FinancialTransaction[];
  metadata?: any;
  date?: Date;
}

export class AccountingService extends Effect.Service<AccountingService>()("@warehouse/accounting", {
  effect: Effect.gen(function* (_) {
    const summarize = ({
      income,
      expenses,
      metadata = {},
    }: {
      income: Record<string, Array<{ name: string; value: number; currency: string; metadata?: any; date: Date }>>;
      expenses: Record<string, Array<{ name: string; value: number; currency: string; metadata?: any; date: Date }>>;
      metadata?: any;
    }) =>
      Effect.sync(() => {
        // Helper to accumulate totals by currency and category
        const currencyTotals: Record<
          string,
          {
            incomes: Record<string, { total: number; count: number; items: FinancialTransactionAmount[] }>;
            expenses: Record<string, { total: number; count: number; items: FinancialTransactionAmount[] }>;
          }
        > = {};

        // Process incomes
        Object.entries(income).forEach(([category, items]) => {
          items.forEach((item) => {
            if (!currencyTotals[item.currency]) {
              currencyTotals[item.currency] = { incomes: {}, expenses: {} };
            }
            if (!currencyTotals[item.currency].incomes[category]) {
              currencyTotals[item.currency].incomes[category] = { total: 0, count: 0, items: [] };
            }
            currencyTotals[item.currency].incomes[category].total += item.value;
            currencyTotals[item.currency].incomes[category].count += 1;
            currencyTotals[item.currency].incomes[category].items.push({
              ...item,
              value: {
                amount: item.value,
                currency: item.currency,
                metadata: item.metadata,
              },
              metadata: item.metadata,
              category,
              type: item.value > 0 ? "income" : "expense",
            });
          });
        });

        // Process expenses
        Object.entries(expenses).forEach(([category, items]) => {
          items.forEach((item) => {
            if (!currencyTotals[item.currency]) {
              currencyTotals[item.currency] = { incomes: {}, expenses: {} };
            }
            if (!currencyTotals[item.currency].expenses[category]) {
              currencyTotals[item.currency].expenses[category] = { total: 0, count: 0, items: [] };
            }
            currencyTotals[item.currency].expenses[category].total += item.value;
            currencyTotals[item.currency].expenses[category].count += 1;
            currencyTotals[item.currency].expenses[category].items.push({
              ...item,
              value: {
                amount: item.value,
                currency: item.currency,
                metadata: item.metadata,
              },
              metadata: item.metadata,
              category,
              type: item.value > 0 ? "income" : "expense",
            });
          });
        });

        // Flatten all items into transactions
        const transactions: FinancialTransaction[] = [];
        Object.entries(income).forEach(([category, items]) => {
          items.forEach((item) => {
            transactions.push({
              id: `${category}-income-${item.name}`,
              date: item.date,
              amounts: [
                {
                  value: { amount: item.value, currency: item.currency, metadata: item.metadata },
                  category,
                  date: item.date,
                  type: "income",
                  metadata: item.metadata,
                },
              ],
              description: `Income: ${item.name}`,
              category,
              type: "income",
              metadata: item.metadata,
            });
          });
        });
        Object.entries(expenses).forEach(([category, items]) => {
          items.forEach((item) => {
            transactions.push({
              id: `${category}-expense-${item.name}`,
              date: item.date,
              amounts: [
                {
                  value: { amount: item.value, currency: item.currency, metadata: item.metadata },
                  category,
                  date: item.date,
                  type: "expense",
                  metadata: item.metadata,
                },
              ],
              description: `Expense: ${item.name}`,
              category,
              type: "expense",
              metadata: item.metadata,
            });
          });
        });

        // Detect mixed transactions (same category and date with both income and expense)
        const grouped = new Map<string, { txs: FinancialTransaction[]; key: string; date: Date; category: string }>();
        for (const tx of transactions) {
          const key = `${tx.category}-${dayjs(tx.date).format("YYYY-MM-DD")}`;
          if (!grouped.has(key)) {
            grouped.set(key, { txs: [], key, date: tx.date, category: tx.category });
          }
          grouped.get(key)!.txs.push(tx);
        }
        const mixedTransactions: FinancialTransaction[] = [];
        for (const { txs, date, category } of grouped.values()) {
          const hasIncome = txs.some((t) => t.type === "income");
          const hasExpense = txs.some((t) => t.type === "expense");
          if (hasIncome && hasExpense) {
            // Merge into a mixed transaction
            mixedTransactions.push({
              id: `${category}-mixed-${dayjs(date).format("YYYY-MM-DD")}`,
              date,
              amounts: txs.flatMap((t) => t.amounts),
              description: `Mixed: ${category}`,
              category,
              type: "mixed",
              metadata: txs.flatMap((t) => t.metadata),
            });
          } else {
            mixedTransactions.push(...txs);
          }
        }

        // --- Build frontend-compatible totalsByCurrency ---
        const allByCurrency: Record<
          string,
          {
            incomes: FinancialTransactionAmount[];
            expenses: FinancialTransactionAmount[];
          }
        > = {};

        for (const tx of mixedTransactions) {
          for (const amt of tx.amounts) {
            const { amount, currency, metadata } = amt.value;
            if (!allByCurrency[currency]) {
              allByCurrency[currency] = { incomes: [], expenses: [] };
            }
            if (amt.type === "income" || (tx.type === "income" && amt.type !== "expense")) {
              allByCurrency[currency].incomes.push({ ...amt, value: { amount, currency, metadata } });
            }
            if (amt.type === "expense" || (tx.type === "expense" && amt.type !== "income")) {
              allByCurrency[currency].expenses.push({ ...amt, value: { amount, currency, metadata } });
            }
          }
        }

        const totalsByCurrency: AccountingTotalsByCurrency = {};

        for (const [currency, { incomes, expenses }] of Object.entries(allByCurrency)) {
          const incomeSum = incomes.filter((e) => e.value.amount > 0).reduce((a, b) => a + b.value.amount, 0);
          const expenseSum = expenses.filter((e) => e.value.amount > 0).reduce((a, b) => a + b.value.amount, 0);
          const netIncome = incomeSum - expenseSum;
          const stornosIncome = incomes.filter((e) => e.value.amount < 0).reduce((a, b) => a + b.value.amount, 0);
          const stornosExpenses = expenses.filter((e) => e.value.amount < 0).reduce((a, b) => a + b.value.amount, 0);

          totalsByCurrency[currency] = {
            incomes,
            expenses,
            netIncome,
            uniqueProductsIncome: 0,
            uniqueProductsExpenses: 0,
            stornos: {
              income: stornosIncome,
              expenses: stornosExpenses,
            },
          };
        }

        return {
          totalsByCurrency,
          transactions: mixedTransactions,
          metadata,
        };
      });

    return {
      summarize,
    } as const;
  }),
  dependencies: [],
}) {}

export const AccountingLive = AccountingService.Default;

export type AccountingInfo = Effect.Effect.Success<ReturnType<AccountingService["summarize"]>>;
