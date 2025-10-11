import { action, json, query } from "@solidjs/router";
import {
  InventoryLive,
  InventoryService,
  type InventoryInfo,
  type StorageStatisticsInfo,
} from "@warehouseoetzidev/core/src/entities/inventory";
import { Effect } from "effect";
import { run } from "./utils";

export const getInventory = query(() => {
  "use server";
  return run(
    "@query/organization-inventory",
    Effect.gen(function* (_) {
      const service = yield* InventoryService;
      return yield* service.statistics();
    }).pipe(Effect.provide(InventoryLive)),
    undefined,
  );
}, "organization-inventory");

export const getInventoryFromStorage = query((storageId: string) => {
  "use server";
  return run(
    "@query/storage-inventory",
    Effect.gen(function* (_) {
      const service = yield* InventoryService;
      return yield* service.storageStatistics(storageId);
    }).pipe(Effect.provide(InventoryLive)),
    undefined,
  );
}, "storage-inventory");

export const getInventoryAlerts = query(() => {
  "use server";
  return run(
    "@query/organization-inventory-alerts",
    Effect.gen(function* (_) {
      const service = yield* InventoryService;
      return yield* service.alerts();
    }).pipe(Effect.provide(InventoryLive)),
    [],
  );
}, "organization-inventory-alerts");

export const getInventoryAlertsHistory = query(() => {
  "use server";
  return run(
    "@query/organization-inventory-alerts-history",
    Effect.gen(function* (_) {
      const service = yield* InventoryService;
      return yield* service.alertsHistory();
    }).pipe(Effect.provide(InventoryLive)),
    [],
  );
}, "organization-inventory-alerts-history");

export const updateInventoryForProduct = action((productId: string, data: { storageId: string; amount: number }) => {
  "use server";
  return run(
    "@action/update-inventory-for-product",
    Effect.gen(function* (_) {
      const service = yield* InventoryService;
      return yield* service.updateInventoryForProduct(productId, data);
    }).pipe(Effect.provide(InventoryLive)),
    undefined,
  );
});
