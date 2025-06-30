import { action, json, query, redirect } from "@solidjs/router";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { PurchasesLive, PurchasesService } from "@warehouseoetzidev/core/src/entities/purchases";
import { Cause, Chunk, Effect, Exit, Layer } from "effect";
import { run, runWithSession } from "./utils";

export const getPurchases = query(() => {
  "use server";
  return run(
    "@query/purchases-by-warehouse-id",
    Effect.gen(function* (_) {
      const ordersService = yield* PurchasesService;
      return yield* ordersService.findByOrganizationId();
    }).pipe(Effect.provide(PurchasesLive)),
    json([]),
  );
}, "purchased-orders");

export const getPendingPurchases = query(() => {
  "use server";
  return run(
    "@query/pending-purchases",
    Effect.gen(function* (_) {
      const ordersService = yield* PurchasesService;
      const orders = yield* ordersService.findByOrganizationId();
      return orders.filter((o) => o.status === "pending" || o.status === "processing");
    }).pipe(Effect.provide(PurchasesLive)),
    json([]),
  );
}, "sales-order-by-warehouse-id");

export const getPurchaseById = query((pid: string) => {
  "use server";
  return run(
    "@query/purchase-by-id",
    Effect.gen(function* (_) {
      const purchaseService = yield* PurchasesService;
      return yield* purchaseService.findById(pid);
    }).pipe(Effect.provide(PurchasesLive)),
    json(undefined),
  );
}, "purchase-by-id");

export const deletePurchase = action(async (pid: string) => {
  "use server";
  return run(
    "@action/delete-purchase",
    Effect.gen(function* (_) {
      const purchaseService = yield* PurchasesService;
      yield* purchaseService.safeRemove(pid);
      return json(
        { success: true },
        {
          revalidate: [getPendingPurchases.key, getPurchaseById.keyFor(pid), getPurchases.key],
        },
      );
    }).pipe(Effect.provide(PurchasesLive)),
    json(
      { success: false },
      {
        revalidate: [getPendingPurchases.key, getPurchaseById.keyFor(pid), getPurchases.key],
      },
    ),
  );
});
