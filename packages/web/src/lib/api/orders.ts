import { action, json, query, redirect } from "@solidjs/router";
import { CustomerOrderLive, CustomerOrderService } from "@warehouseoetzidev/core/src/entities/orders";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationNotFound } from "@warehouseoetzidev/core/src/entities/organizations/errors";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { Cause, Chunk, Effect, Exit, Layer } from "effect";
import { getAuthenticatedUser } from "./auth";
import { getSales } from "./sales";
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
      const orderService = yield* _(CustomerOrderService);
      const orders = yield* orderService.findByOrganizationId(orgId);
      return orders;
    }).pipe(Effect.provide(CustomerOrderLive)),
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
      throw new Error(`Some error(s) occurred at 'getCustomerOrders': ${errors.join(", ")}`);
    },
  });
}, "customer-order-by-warehouse-id");

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
      const orderService = yield* _(CustomerOrderService);
      const user = yield* userService.findById(uid);
      if (!user) {
        return yield* Effect.fail(new Error("User not found"));
      }
      const orders = yield* orderService.findByUserId(user.id);
      return orders;
    }).pipe(Effect.provide(UserLive), Effect.provide(CustomerOrderLive)),
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
  const orgId = session.current_organization_id;
  if (!orgId) {
    throw redirect("/", { status: 403, statusText: "Forbidden" });
  }

  const organizationIdLayer = Layer.succeed(OrganizationId, orgId);
  const order = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const orderService = yield* _(CustomerOrderService);
      const order = yield* orderService.findById(oid);
      return order;
    }).pipe(Effect.provide(CustomerOrderLive), Effect.provide(organizationIdLayer)),
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
      const orderService = yield* _(CustomerOrderService);

      yield* orderService.update({ id: oid, status: "deleted", deletedAt: new Date() });
      return true;
    }).pipe(Effect.provide(CustomerOrderLive)),
  );

  return Exit.match(result, {
    onSuccess: () => {
      return json(
        { success: true },
        {
          revalidate: [
            getCustomerOrders.key,
            getOrdersByUserId.key,
            getOrderById.keyFor(oid),
            getAuthenticatedUser.key,
          ],
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

export const convertToSale = action(
  async (id: string, cid: string, products: Array<{ id: string; quantity: number }>) => {
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

    const organizationIdLayer = Layer.succeed(OrganizationId, orgId);
    const order = await Effect.runPromiseExit(
      Effect.gen(function* (_) {
        const orderService = yield* _(CustomerOrderService);
        return yield* orderService.convertToSale(id, cid, products);
      }).pipe(Effect.provide(CustomerOrderLive), Effect.provide(organizationIdLayer)),
    );
    return Exit.match(order, {
      onSuccess: (order) => {
        return json(order, {
          revalidate: [getCustomerOrders.key, getOrdersByUserId.key, getOrderById.keyFor(id), getSales.key],
        });
      },
      onFailure: (cause) => {
        console.error("Failed to convert order to sale:", cause);
        const causes = Cause.failures(cause);
        const errors = Chunk.toReadonlyArray(causes).map((c) => {
          return c.message;
        });
        throw new Error(`Some error(s) occurred at 'convertToSale': ${errors.join(", ")}`);
      },
    });
  },
);

export const downloadOrderSheet = action(async (id: string) => {
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
  const organizationIdLayer = Layer.succeed(OrganizationId, orgId);
  const order = await Effect.runPromise(
    Effect.gen(function* (_) {
      const orderService = yield* _(CustomerOrderService);
      const order = yield* orderService.findById(id);
      const organizationService = yield* _(OrganizationService);
      const org = yield* organizationService.findById(orgId);
      const pdf = yield* orderService.generatePDF(id, org, { page: { size: "A4", orientation: "portrait" } });
      return yield* Effect.succeed({
        pdf: pdf.toString("base64"),
        name: order.barcode ?? order.createdAt.toISOString(),
      });
    }).pipe(Effect.provide(CustomerOrderLive), Effect.provide(OrganizationLive), Effect.provide(organizationIdLayer)),
  );
  return json(order);
});

export const createOrder = action(
  async (data: {
    customer_id: string;
    products: {
      product_id: string;
      quantity: number;
    }[];
  }) => {
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
    const organizationIdLayer = Layer.succeed(OrganizationId, orgId);
    const order = await Effect.runPromiseExit(
      Effect.gen(function* (_) {
        const orderService = yield* _(CustomerOrderService);
        const barcode = `order-${Math.floor(Math.random() * 1000000)}`;
        const order = yield* orderService.create(
          { customer_id: data.customer_id, title: "New Order", description: "", barcode },
          data.products,
        );
        return order;
      }).pipe(Effect.provide(CustomerOrderLive), Effect.provide(organizationIdLayer)),
    );
    return Exit.match(order, {
      onSuccess: (order) => {
        return json(order, {
          revalidate: [
            getCustomerOrders.key,
            getOrdersByUserId.key,
            getOrderById.keyFor(order.id),
            getAuthenticatedUser.key,
          ],
        });
      },
      onFailure: (cause) => {
        console.log(cause);
        const causes = Cause.failures(cause);
        const errors = Chunk.toReadonlyArray(causes).map((c) => c.message);
        throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
      },
    });
  },
);
