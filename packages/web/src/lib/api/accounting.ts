import { json, query } from "@solidjs/router";
import { AccountingLive, AccountingService } from "@warehouseoetzidev/core/src/entities/accounting";
import { SalesLive, SalesService } from "@warehouseoetzidev/core/src/entities/sales";
import { SupplierLive, SupplierService } from "@warehouseoetzidev/core/src/entities/suppliers";
import { Effect } from "effect";
import { run } from "./utils";

export const getAccountingList = query(async () => {
  "use server";
  return run(
    "@query/accounting-list",
    Effect.gen(function* (_) {
      const accounting = yield* _(AccountingService);
      const salesService = yield* _(SalesService);
      const supplierService = yield* _(SupplierService);
      const sales = yield* salesService.listIncomes();
      const income = {
        sales,
      };

      const boughtBySuppliers = yield* supplierService.getPurchases();

      const expenses = {
        bought: boughtBySuppliers,
      };
      return yield* accounting.summarize({ income, expenses });
    }).pipe(Effect.provide(AccountingLive), Effect.provide(SalesLive), Effect.provide(SupplierLive)),
    json([]),
  );
}, "organization-accounting");
