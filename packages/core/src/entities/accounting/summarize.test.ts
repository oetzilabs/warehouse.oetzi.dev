import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import { AccountingLive, AccountingService } from "./index";

describe("AccountingService.summarize", () => {
  it.effect("should summarize income and expenses correctly", () =>
    Effect.gen(function* () {
      const service = yield* AccountingService;
      const income = {
        sales: [
          { name: "ProductA", value: 100, currency: "CHF", metadata: { note: "retail" }, date: new Date() },
          { name: "ProductB", value: 50, currency: "CHF", date: new Date() },
          { name: "ProductC", value: 200, currency: "EUR", date: new Date() },
        ],
        services: [{ name: "Consulting", value: 300, currency: "CHF", date: new Date() }],
      };

      const expenses = {
        supplies: [
          { name: "Paper", value: 20, currency: "CHF", date: new Date() },
          { name: "Ink", value: 10, currency: "CHF", date: new Date() },
        ],
        rent: [{ name: "Office", value: 500, currency: "EUR", date: new Date() }],
      };

      const summary = yield* service.summarize({ income, expenses });

      // CHF checks
      const chf = summary.totalsByCurrency.CHF;
      expect(chf.incomes.filter((i) => i.category === "sales").reduce((a, b) => a + b.value.amount, 0)).toBe(150);
      expect(chf.incomes.filter((i) => i.category === "sales").length).toBe(2);
      expect(chf.incomes.filter((i) => i.category === "services").reduce((a, b) => a + b.value.amount, 0)).toBe(300);
      expect(chf.expenses.filter((e) => e.category === "supplies").reduce((a, b) => a + b.value.amount, 0)).toBe(30);
      expect(chf.expenses.filter((e) => e.category === "supplies").length).toBe(2);

      // EUR checks
      const eur = summary.totalsByCurrency.EUR;
      expect(eur.incomes.filter((i) => i.category === "sales").reduce((a, b) => a + b.value.amount, 0)).toBe(200);
      expect(eur.expenses.filter((e) => e.category === "rent").reduce((a, b) => a + b.value.amount, 0)).toBe(500);

      // Net income
      expect(chf.netIncome).toBe(150 + 300 - 30);
      expect(eur.netIncome).toBe(200 - 500);

      // Transactions
      expect(summary.transactions.length).toBe(7);
      expect(summary.transactions.find((t) => t.description === "Income: ProductA")?.type).toBe("income");
      expect(summary.transactions.find((t) => t.description === "Expense: Paper")?.type).toBe("expense");
    }).pipe(Effect.provide(AccountingLive)),
  );

  it.effect("should handle multiple currencies, negative values, and mixed transactions", () =>
    Effect.gen(function* () {
      const service = yield* AccountingService;
      const income = {
        sales: [
          { name: "ProductA", value: 100, currency: "USD", date: new Date() },
          { name: "ProductB", value: 50, currency: "USD", date: new Date() },
          { name: "ProductC", value: 200, currency: "EUR", date: new Date() },
          { name: "ProductD", value: -20, currency: "USD", date: new Date() }, // storned sale
        ],
        services: [
          { name: "Consulting", value: 300, currency: "USD", date: new Date() },
          { name: "Support", value: 100, currency: "EUR", date: new Date() },
        ],
      };

      const expenses = {
        supplies: [
          { name: "Paper", value: 20, currency: "USD", date: new Date() },
          { name: "Ink", value: 10, currency: "USD", date: new Date() },
          { name: "Refund", value: -5, currency: "USD", date: new Date() }, // storned expense
        ],
        rent: [
          { name: "Office", value: 500, currency: "EUR", date: new Date() },
          { name: "Storage", value: 100, currency: "USD", date: new Date() },
        ],
      };

      const summary = yield* service.summarize({ income, expenses });

      // USD checks
      const usd = summary.totalsByCurrency.USD;
      expect(usd.incomes.filter((i) => i.category === "sales").reduce((a, b) => a + b.value.amount, 0)).toBe(130); // 100+50-20
      expect(usd.incomes.filter((i) => i.category === "sales").length).toBe(3);
      expect(usd.incomes.filter((i) => i.category === "services").reduce((a, b) => a + b.value.amount, 0)).toBe(300);
      expect(usd.expenses.filter((e) => e.category === "supplies").reduce((a, b) => a + b.value.amount, 0)).toBe(25); // 20+10-5
      expect(usd.expenses.filter((e) => e.category === "supplies").length).toBe(3);
      expect(usd.expenses.filter((e) => e.category === "rent").reduce((a, b) => a + b.value.amount, 0)).toBe(100);

      // Stornos
      expect(usd.stornos.income).toBe(-20);
      expect(usd.stornos.expenses).toBe(-5);

      // Net income
      const usdIncomeSum = usd.incomes.filter((e) => e.value.amount > 0).reduce((a, b) => a + b.value.amount, 0);
      const usdExpenseSum = usd.expenses.filter((e) => e.value.amount > 0).reduce((a, b) => a + b.value.amount, 0);
      expect(usd.netIncome).toBe(usdIncomeSum - usdExpenseSum);

      // EUR checks
      const eur = summary.totalsByCurrency.EUR;
      expect(eur.incomes.filter((i) => i.category === "sales").reduce((a, b) => a + b.value.amount, 0)).toBe(200);
      expect(eur.incomes.filter((i) => i.category === "services").reduce((a, b) => a + b.value.amount, 0)).toBe(100);
      expect(eur.expenses.filter((e) => e.category === "rent").reduce((a, b) => a + b.value.amount, 0)).toBe(500);

      // Net income
      const eurIncomeSum = eur.incomes.filter((e) => e.value.amount > 0).reduce((a, b) => a + b.value.amount, 0);
      const eurExpenseSum = eur.expenses.filter((e) => e.value.amount > 0).reduce((a, b) => a + b.value.amount, 0);
      expect(eur.netIncome).toBe(eurIncomeSum - eurExpenseSum);

      // Transactions: 4+2 incomes, 3+2 expenses = 11
      expect(summary.transactions.length).toBe(11);

      // Check for storned transactions
      expect(summary.transactions.some((t) => t.amounts.some((a) => a.value.amount < 0))).toBe(true);

      // Check for mixed transaction logic (should not merge in this simple case)
      expect(summary.transactions.filter((t) => t.type === "mixed").length).toBe(0);

      // Check that all categories are present
      const allCategories = summary.transactions.map((t) => t.category);
      expect(allCategories).toContain("sales");
      expect(allCategories).toContain("services");
      expect(allCategories).toContain("supplies");
      expect(allCategories).toContain("rent");
    }).pipe(Effect.provide(AccountingLive)),
  );
});
