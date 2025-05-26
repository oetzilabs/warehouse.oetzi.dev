import { query, redirect } from "@solidjs/router";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { Effect } from "effect";
import { withSession } from "./session";

export const getInventory = query(async () => {
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
  const warehouse_inventory = await Effect.runPromise(
    Effect.gen(function* (_) {
      const service = yield* _(WarehouseService);
      const wh = yield* service.findById(whId);
      if (!wh) {
        return yield* Effect.fail(new Error("Warehouse not found"));
      }
      const facilites = wh.fcs;
      const areas = facilites.map((fc) => fc.ars).flat();
      const storages = areas.map((a) => a.strs).flat();

      return yield* Effect.succeed({
        amountOfFacilities: facilites.length,
        amounOfStorages: storages.length,
        totalCurrentOccupancy: storages
          .map((s) => s.invs.map((i) => i.products.length))
          .flat()
          .reduce((a, b) => a + b, 0),
        totalCapacity: storages
          .map((s) => s.invs.map((i) => i.productCapacity))
          .flat()
          .reduce((a, b) => a + b, 0),
      });
    }).pipe(Effect.provide(WarehouseLive)),
  );
  return warehouse_inventory;
}, "warehouse-inventory");
