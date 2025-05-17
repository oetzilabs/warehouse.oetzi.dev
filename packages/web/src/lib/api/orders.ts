import { query, redirect } from "@solidjs/router";
import { OrderLive, OrderService } from "@warehouseoetzidev/core/src/entities/orders";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { WarehouseNotFound } from "@warehouseoetzidev/core/src/entities/warehouses/errors";
import { Effect } from "effect";
import { withSession } from "./session";

export const getOrdersByWarehouseId = query(async (whid: string) => {
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
      const orderService = yield* _(OrderService);
      const wh = yield* whService.findById(whid);
      if (!wh) {
        return yield* Effect.fail(new WarehouseNotFound({ id: whid }));
      }
      const orders = yield* orderService.findByWarehouseId(wh.id);
      return orders;
    }).pipe(Effect.provide(WarehouseLive), Effect.provide(OrderLive)),
  );
  return warehouse;
}, "order-by-warehouse-id");

export const getOrdersByUserId = query(async (uid: string) => {
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
      const userService = yield* _(UserService);
      const orderService = yield* _(OrderService);
      const user = yield* userService.findById(uid);
      const orders = yield* orderService.findByWarehouseId(user.id);
      return orders;
    }).pipe(Effect.provide(UserLive), Effect.provide(OrderLive)),
  );
  return warehouse;
}, "order-by-user-id");
