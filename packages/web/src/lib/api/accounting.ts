import { json, query } from "@solidjs/router";
import { AccountingLive, AccountingService } from "@warehouseoetzidev/core/src/entities/accounting";
import { SalesLive, SalesService } from "@warehouseoetzidev/core/src/entities/sales";
import { SupplierLive, SupplierService } from "@warehouseoetzidev/core/src/entities/suppliers";
import { Effect } from "effect";
import { run } from "./utils";

export const getAccountingList = query(() => {
  "use server";
  return run(
    "@query/accounting-list",
    Effect.gen(function* (_) {
      const accounting = yield* AccountingService;
      const salesService = yield* SalesService;
      const supplierService = yield* SupplierService;
      const sales = yield* salesService.listIncomes();
      const income = {
        sales,
      };

      const boughtBySuppliers = yield* supplierService.getPurchases();

      const expenses = {
        bought: boughtBySuppliers,
      };

      const result = yield* accounting.summarize({ income, expenses });
      return json(result);
    }).pipe(Effect.provide(AccountingLive), Effect.provide(SalesLive), Effect.provide(SupplierLive)),
    json(undefined),
  );
}, "organization-accounting");
