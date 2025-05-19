import { query, redirect } from "@solidjs/router";
import { ProductLive, ProductService } from "@warehouseoetzidev/core/src/entities/products";
import { ProductLabelsLive, ProductLabelsService } from "@warehouseoetzidev/core/src/entities/products/labels";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { WarehouseNotFound } from "@warehouseoetzidev/core/src/entities/warehouses/errors";
import { Effect } from "effect";
import { withSession } from "./session";

export const getProductsByWarehouseId = query(async (whid: string) => {
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
      const productsService = yield* _(ProductService);
      const wh = yield* whService.findById(whid);
      if (!wh) {
        return yield* Effect.fail(new WarehouseNotFound({ id: whid }));
      }
      const products = yield* productsService.findByWarehouseId(wh.id);
      return products;
    }).pipe(Effect.provide(WarehouseLive), Effect.provide(ProductLive)),
  );
  return warehouse;
}, "order-by-warehouse-id");

export const getProductLabels = query(async () => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const labels = await Effect.runPromise(
    Effect.gen(function* (_) {
      const productLabelsService = yield* _(ProductLabelsService);
      const labels = yield* productLabelsService.findAllWithoutProducts();
      return labels;
    }).pipe(Effect.provide(ProductLabelsLive)),
  );
  return labels;
}, "labels");
