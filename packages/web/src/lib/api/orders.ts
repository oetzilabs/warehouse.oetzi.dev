import { json, query, redirect } from "@solidjs/router";
import { OrderLive, OrderService } from "@warehouseoetzidev/core/src/entities/orders";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { WarehouseNotFound } from "@warehouseoetzidev/core/src/entities/warehouses/errors";
import { Cause, Chunk, Effect, Exit } from "effect";
import { withSession } from "./session";

export const getCustomerOrdersByWarehouseId = query(async (whid: string) => {
  "use server";
  const auth = await withSession();
  if (!auth) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const user = auth[0];
  if (!user) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orders = await Effect.runPromiseExit(
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
  return Exit.match(orders, {
    onSuccess: (ords) => {
      return json(ords);
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
    },
  });
}, "customer-order-by-warehouse-id");

export const getSupplyOrdersByWarehouseId = query(async (whid: string) => {
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
  const orders = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const whService = yield* _(WarehouseService);
      const ordersService = yield* _(OrderService);
      const wh = yield* whService.findById(whId);
      if (!wh) {
        return yield* Effect.fail(new WarehouseNotFound({ id: whId }));
      }
      const orders = yield* ordersService.findByWarehouseId(wh.id);
      return orders;
    }).pipe(Effect.provide(WarehouseLive), Effect.provide(OrderLive)),
  );
  return Exit.match(orders, {
    onSuccess: (ords) => {
      return json(ords);
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
    },
  });
}, "sales-order-by-warehouse-id");

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
  const orders = await Effect.runPromise(
    Effect.gen(function* (_) {
      const userService = yield* _(UserService);
      const orderService = yield* _(OrderService);
      const user = yield* userService.findById(uid);
      const orders = yield* orderService.findByWarehouseId(user.id);
      return orders;
    }).pipe(Effect.provide(UserLive), Effect.provide(OrderLive)),
  );
  return orders;
}, "order-by-user-id");
