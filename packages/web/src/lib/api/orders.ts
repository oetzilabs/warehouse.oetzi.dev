import { action, json, query, redirect } from "@solidjs/router";
import {
  CustomerOrderByUserIdInfo,
  CustomerOrderInfo,
  CustomerOrderLive,
  CustomerOrderService,
} from "@warehouseoetzidev/core/src/entities/orders";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationNotFound } from "@warehouseoetzidev/core/src/entities/organizations/errors";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { UserLive, UserService } from "@warehouseoetzidev/core/src/entities/users";
import { Cause, Chunk, Effect, Exit, Layer } from "effect";
import { getAuthenticatedUser } from "./auth";
import { getSales } from "./sales";
import { run, runWithSession } from "./utils";

export const getCustomerOrders = query(() => {
  "use server";
  return run(
    "@query/customer-order-by-warehouse-id",
    Effect.gen(function* (_) {
      const orderService = yield* CustomerOrderService;
      const orders = yield* orderService.findByOrganizationId();
      return json(orders);
    }).pipe(Effect.provide(CustomerOrderLive)),
    json([] as CustomerOrderInfo[]),
  );
}, "customer-order-by-warehouse-id");

export const getOrdersByUserId = query(() => {
  "use server";
  return runWithSession(
    "@query/order-by-user-id",
    Effect.fn(
      function* (session) {
        const userService = yield* UserService;
        const orderService = yield* CustomerOrderService;
        const user = yield* userService.findById(session.user_id);
        if (!user) {
          return yield* Effect.fail(new Error("User not found"));
        }
        const orders = yield* orderService.findByUserId(user.id);
        return json(orders);
      },
      (effect) => effect.pipe(Effect.provide(UserLive), Effect.provide(CustomerOrderLive)),
    ),
    json([] as CustomerOrderByUserIdInfo[]),
  );
}, "order-by-user-id");

export const getOrderById = query(async (oid: string) => {
  "use server";
  return run(
    "@query/order-by-id",
    Effect.gen(function* () {
      if (!oid) {
        return json(undefined);
      }
      const orderService = yield* CustomerOrderService;
      return yield* orderService.findById(oid);
    }).pipe(Effect.provide(CustomerOrderLive)),
    (errors) =>
      json(errors, {
        status: 500,
      }),
  );
}, "order-by-id");

export const deleteOrder = action((oid: string) => {
  "use server";
  return run(
    "@action/delete-order",
    Effect.gen(function* (_) {
      const orderService = yield* CustomerOrderService;

      yield* orderService.update({ id: oid, status: "deleted", deletedAt: new Date() });
      return true;
    }).pipe(Effect.provide(CustomerOrderLive)),
    (errors) =>
      json(errors, {
        status: 500,
      }),
  );
});

export const convertToSale = action((id: string, cid: string, products: Array<{ id: string; quantity: number }>) => {
  "use server";
  return run(
    "@action/convert-to-sale",
    Effect.gen(function* (_) {
      const orderService = yield* _(CustomerOrderService);
      const orderConverted = yield* orderService.convertToSale(id, cid, products);
      return json(orderConverted, {
        revalidate: [getCustomerOrders.key, getOrdersByUserId.key, getOrderById.keyFor(id), getSales.key],
      });
    }).pipe(Effect.provide(CustomerOrderLive)),
    (errors) =>
      json(errors, {
        status: 500,
      }),
  );
});

export const downloadOrderSheet = action(async (id: string) => {
  "use server";

  return runWithSession(
    "@action/download-order-sheet",
    Effect.fn(
      function* (session) {
        const orderService = yield* CustomerOrderService;
        const order = yield* orderService.findById(id);
        const organizationService = yield* OrganizationService;
        const org = yield* organizationService.findById(session.current_organization_id);
        const pdf = yield* orderService.generatePDF(id, org, { page: { size: "A4", orientation: "portrait" } });
        const x = {
          pdf: pdf.toString("base64"),
          name: order.barcode ?? order.createdAt.toISOString(),
        } satisfies { pdf: string; name: string };
        return json(x);
      },
      (effect) => effect.pipe(Effect.provide(CustomerOrderLive), Effect.provide(OrganizationLive)),
    ),
    (errors) =>
      json(errors, {
        status: 500,
      }),
  );
});

export const createOrder = action(
  (data: {
    customer_id: string;
    products: {
      product_id: string;
      quantity: number;
    }[];
  }) => {
    "use server";
    return run(
      "@action/create-order",
      Effect.gen(function* (_) {
        const orderService = yield* CustomerOrderService;
        const barcode = `order-${Math.floor(Math.random() * 1000000)}`;
        const order = yield* orderService.create(
          { customer_id: data.customer_id, title: "New Order", description: "", barcode },
          data.products,
        );
        return json(order, {
          revalidate: [
            getCustomerOrders.key,
            getOrdersByUserId.key,
            getOrderById.keyFor(order.id),
            getAuthenticatedUser.key,
          ],
        });
      }).pipe(Effect.provide(CustomerOrderLive)),
      (errors) =>
        json(errors, {
          status: 500,
        }),
    );
  },
);
