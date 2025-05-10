import { query, redirect } from "@solidjs/router";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Effect } from "effect";
import { withSession } from "./session";

export const getStorages = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const session = auth[1];
  if (!session) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const whId = session.current_warehouse_id;
  if (!whId) {
    if (!user.has_finished_onboarding) {
      return redirect("/onboarding");
    }
    throw new Error("You have to be part of an organization to perform this action.");
  }
  const warehouse_storages = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseService);
      const wh = yield* service.findById(whId);
      if (!wh) {
        return yield* Effect.fail(new Error("Warehouse not found"));
      }
      return wh.storages.map((s) => s.storage);
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouse_storages;
}, "warehouse-storages");
