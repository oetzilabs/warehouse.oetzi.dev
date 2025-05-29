import { action, json, query, redirect } from "@solidjs/router";
import { OrderInfo, OrderLive, OrderService } from "@warehouseoetzidev/core/src/entities/orders";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { WarehouseLive, WarehouseService } from "@warehouseoetzidev/core/src/entities/warehouses";
import { WarehouseNotFound } from "@warehouseoetzidev/core/src/entities/warehouses/errors";
import { Cause, Chunk, Effect, Exit } from "effect";
import { withSession } from "./session";

export const getCustomerOrders = query(async () => {
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
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orders = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const orderService = yield* _(OrderService);
      const orders = yield* orderService.findCustomerOrdersByOrganizationId(orgId);
      return orders;
    }).pipe(Effect.provide(OrderLive)),
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

export const getSupplyOrders = query(async () => {
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
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orders = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const ordersService = yield* _(OrderService);
      const orders = yield* ordersService.findSupplierOrdersByOrganizationId(orgId);
      return orders;
    }).pipe(Effect.provide(OrderLive)),
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

export const getPendingSupplyOrders = query(async () => {
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
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }
  const orders = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const ordersService = yield* _(OrderService);
      const orders = yield* ordersService.findSupplierOrdersByOrganizationId(orgId);
      return orders.filter((o) => o.order.status === "pending" || o.order.status === "processing");
    }).pipe(Effect.provide(OrderLive)),
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
      if (!user) {
        return yield* Effect.fail(new Error("User not found"));
      }
      const orders = yield* orderService.findByUserId(user.id);
      return orders;
    }).pipe(Effect.provide(UserLive), Effect.provide(OrderLive)),
  );
  return orders;
}, "order-by-user-id");

export const getOrderById = query(async (oid: string) => {
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

  const order = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const orderService = yield* _(OrderService);
      const order = yield* orderService.findById(oid);
      return order;
    }).pipe(Effect.provide(OrderLive)),
  );

  return Exit.match(order, {
    onSuccess: (order) => {
      return json(order);
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => c.message);
      throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
    },
  });
}, "order-by-id");

export const deleteOrder = action(async (oid: string) => {
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

  const result = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const orderService = yield* _(OrderService);
      yield* orderService.safeRemove(oid);
      return true;
    }).pipe(Effect.provide(OrderLive)),
  );

  return Exit.match(result, {
    onSuccess: () => {
      return json(
        { success: true },
        {
          revalidate: [getCustomerOrders.key, getSupplyOrders.key, getOrdersByUserId.key, getOrderById.keyFor(oid)],
        },
      );
    },
    onFailure: (cause) => {
      console.log(cause);
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => c.message);
      throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
    },
  });
});
