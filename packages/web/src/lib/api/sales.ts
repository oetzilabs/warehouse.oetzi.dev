import { action, json, query, redirect } from "@solidjs/router";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import {
  SaleInfo,
  SalesByOrganizationIdInfo,
  SalesLive,
  SalesService,
} from "@warehouseoetzidev/core/src/entities/sales";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import { Cause, Chunk, Effect, Exit, Layer } from "effect";
import { run, runWithSession } from "./utils";

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
      return json(sales);
    }).pipe(Effect.provide(SalesLive)),
    json([] as SalesByOrganizationIdInfo[]),
  );
}, "sales-by-organization-id");

export const getSaleById = query((sid: string) => {
  "use server";
  return run(
    "@query/sale-by-id",
    Effect.gen(function* (_) {
      const salesService = yield* SalesService;
      const sale = yield* salesService.findById(sid);
      return sale;
    }).pipe(Effect.provide(SalesLive)),
    (error) =>
      json(error, {
        status: 404,
        statusText: "Not Found",
      }),
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
