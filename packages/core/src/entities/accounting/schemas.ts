import { Effect, Schema } from "effect";

// Common schema builders
const StringRecord = <A>(schema: Schema.Schema<A>) =>
  Schema.Struct({
    data: Schema.Record({ key: Schema.String, value: schema }),
  });

// Metadata schema for reusability
const MetadataSchema = Schema.optional(StringRecord(Schema.Unknown));

// Basic schemas for financial amounts and transactions
export const Money = Schema.Struct({
  amount: Schema.Number,
  currency: Schema.String,
  metadata: MetadataSchema,
});

// Transaction type definitions
export const TransactionType = Schema.Union(Schema.Literal("income"), Schema.Literal("expense"));
export const ExtendedTransactionType = Schema.Union(
  Schema.Union(Schema.Literal("income"), Schema.Literal("expense")),
  Schema.Literal("mixed"),
);

export const TransactionAmount = Schema.Struct({
  value: Money,
  category: Schema.String,
  date: Schema.DateFromSelf,
  type: TransactionType,
  metadata: MetadataSchema,
});

export const Transaction = Schema.Struct({
  id: Schema.String,
  date: Schema.DateFromSelf,
  amounts: Schema.Array(TransactionAmount),
  description: Schema.String,
  category: Schema.String,
  type: ExtendedTransactionType,
  metadata: MetadataSchema,
});

// Summary schema for financial totals
export const CategoryTotal = Schema.Struct({
  total: Money,
  count: Schema.Number,
  metadata: MetadataSchema,
});

// Record schema for mapping categories to totals
const CategoryTotalsSchema = StringRecord(CategoryTotal);

export const CurrencyTotal = Schema.Struct({
  incomes: CategoryTotalsSchema,
  expenses: CategoryTotalsSchema,
  netIncome: Money,
  metadata: MetadataSchema,
});

// Record schema for mapping currencies to totals
const CurrencyTotalsSchema = StringRecord(CurrencyTotal);

export const FinancialSummary = Schema.Struct({
  summaryDate: Schema.DateFromSelf,
  totalsByCurrency: CurrencyTotalsSchema,
  transactions: Schema.Array(Transaction),
  metadata: MetadataSchema,
});

// Extracted types from schemas
export type Money = Schema.Schema.Type<typeof Money>;
export type TransactionType = Schema.Schema.Type<typeof TransactionType>;
export type ExtendedTransactionType = Schema.Schema.Type<typeof ExtendedTransactionType>;
export type TransactionAmount = Schema.Schema.Type<typeof TransactionAmount>;
export type Transaction = Schema.Schema.Type<typeof Transaction>;
export type CategoryTotal = Schema.Schema.Type<typeof CategoryTotal>;
export type CurrencyTotal = Schema.Schema.Type<typeof CurrencyTotal>;
export type FinancialSummary = Schema.Schema.Type<typeof FinancialSummary>;
