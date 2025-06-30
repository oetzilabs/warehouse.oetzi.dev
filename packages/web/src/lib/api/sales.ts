import { action, json, query, redirect } from "@solidjs/router";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { SalesLive, SalesService } from "@warehouseoetzidev/core/src/entities/sales";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import { Cause, Chunk, Effect, Exit, Layer } from "effect";
import { run, runWithSession } from "./utils";

export const getSalesLastFewMonths = query(() => {
  "use server";
  return run(
    "@query/sales-last-few-months",
    Effect.gen(function* (_) {
      const months = new Array(6)
        .fill(0)
        .map((_, i) => i + 1)
        .map((i) => dayjs().subtract(i, "month"));
      const range = months.map((m) => m.toDate());
      const salesService = yield* SalesService;
      const sales = yield* salesService.findWithinRange(range[0], range[5]);
      return {
        labels: months.map((m) => m.format("MMM")),
        datasets: [
          {
            label: "Sales",
            data: [0],
            fill: false,
            pointStyle: false,
          },
        ],
      };
    }).pipe(Effect.provide(SalesLive)),
    json([]),
  );
}, "sales-last-few-months");

export const getSales = query(() => {
  "use server";
  return run(
    "@query/sales-by-organization-id",
    Effect.gen(function* (_) {
      const salesService = yield* SalesService;
      const sales = yield* salesService.findByOrganizationId();
      if (!sales) {
        return yield* Effect.fail(new Error("Sale not found"));
      }
      return sales;
    }).pipe(Effect.provide(SalesLive)),
    json([]),
  );
}, "sales-by-organization-id");

export const getSaleById = query((sid: string) => {
  "use server";
  return run(
    "@query/sale-by-id",
    Effect.gen(function* (_) {
      const salesService = yield* SalesService;
      const sale = yield* salesService.findById(sid);
      if (!sale) {
        return yield* Effect.fail(new Error("Sale not found"));
      }
      return sale;
    }).pipe(Effect.provide(SalesLive)),
    json(undefined),
  );
}, "sale-by-id");

export const deleteSale = action((sid: string) => {
  "use server";
  return run(
    "@action/delete-sale",
    Effect.gen(function* (_) {
      const salesService = yield* SalesService;
      yield* salesService.safeRemove(sid);
      return json(
        { success: true },
        {
          revalidate: [getSales.key, getSaleById.keyFor(sid)],
        },
      );
    }).pipe(Effect.provide(SalesLive)),
    json(
      { success: false },
      {
        revalidate: [getSales.key, getSaleById.keyFor(sid)],
      },
    ),
  );
});
