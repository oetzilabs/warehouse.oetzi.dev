import { query, redirect } from "@solidjs/router";
import { SalesLive, SalesService } from "@warehouseoetzidev/core/src/entities/sales";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import { Effect } from "effect";
import { withSession } from "./session";

export const getSalesLastFewMonths = query(async () => {
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
  // create a date range of the last few months
  const months = new Array(6)
    .fill(0)
    .map((_, i) => i + 1)
    .map((i) => dayjs().subtract(i, "month"));
  const range = months.map((m) => m.toDate());

  const sales = await Effect.runPromise(
    Effect.gen(function* (_) {
      const salesService = yield* _(SalesService);
      const sales = yield* salesService.findWithinRange(whId, range[0], range[5]);
      if (!sales) {
        return yield* Effect.fail(new Error("Sale not found"));
      }
      return sales;
    }).pipe(Effect.provide(SalesLive)),
  );

  const obj = {
    labels: months.map((m) => m.format("MMM")),
    datasets: [
      {
        label: "Sales",
        data: sales.map((s) => s.total),
        fill: false,
        pointStyle: false,
      },
    ],
  };
  return obj;
}, "sales-last-few-months");

export const getSalesByWarehouseId = query(async (whid: string) => {
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
  const sales = await Effect.runPromise(
    Effect.gen(function* (_) {
      const salesService = yield* _(SalesService);
      const sales = yield* salesService.findByWarehouseId(whId);
      if (!sales) {
        return yield* Effect.fail(new Error("Sale not found"));
      }
      return sales;
    }).pipe(Effect.provide(SalesLive)),
  );
  return sales;
}, "sales-by-warehouse-id");

export const getWarehouseSaleById = query(async (whid, sid: string) => {
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

  const sale = await Effect.runPromise(
    Effect.gen(function* (_) {
      const salesService = yield* _(SalesService);
      const warehouseService = yield* _(WarehouseService);
      const warehouse = yield* warehouseService.findById(whid);
      if (!warehouse) {
        return yield* Effect.fail(new Error("Warehouse not found"));
      }
      const sale = yield* salesService.findById(sid);
      if (!sale) {
        return yield* Effect.fail(new Error("Sale not found"));
      }
      if (sale.warehouseId !== warehouse.id) {
        return yield* Effect.fail(new Error("This sale is not associated with this warehouse"));
      }
      return sales;
    }).pipe(Effect.provide(SalesLive), Effect.provide(WarehouseLive)),
  );
  return sale;
}, "sale-by-id");
