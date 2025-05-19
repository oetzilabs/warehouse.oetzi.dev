import { query, redirect } from "@solidjs/router";
import { SupplierLive, SupplierService } from "@warehouseoetzidev/core/src/entities/suppliers";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { WarehouseNotFound } from "@warehouseoetzidev/core/src/entities/warehouses/errors";
import { Effect } from "effect";
import { withSession } from "./session";

export const getSuppliersByWarehouseId = query(async (whid: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const warehouse = await Effect.runPromise(
    Effect.gen(function* (_) {
      const whService = yield* _(WarehouseService);
      const supplierService = yield* _(SupplierService);
      const wh = yield* whService.findById(whid);
      if (!wh) {
        return yield* Effect.fail(new WarehouseNotFound({ id: whid }));
      }
      const suppliers = yield* supplierService.findByWarehouseId(wh.id);
      return suppliers;
    }).pipe(Effect.provide(WarehouseLive), Effect.provide(SupplierLive)),
  );
  return warehouse;
}, "order-by-warehouse-id");
