import { json, query } from "@solidjs/router";
import { NotificationLive, NotificationService } from "@warehouseoetzidev/core/src/entities/notifications";
import { CustomerOrderLive, CustomerOrderService } from "@warehouseoetzidev/core/src/entities/orders";
import { OrganizationLive, OrganizationService } from "@warehouseoetzidev/core/src/entities/organizations";
import dayjs from "dayjs";
import { Effect } from "effect";
import { run } from "./utils";

export const getDashboardData = query(() => {
  "use server";
  return run(
    "@query/dashboard-data",
    Effect.gen(function* (_) {
      const organizationService = yield* OrganizationService;
      const notificationService = yield* NotificationService;

      const organization = yield* organizationService.getDashboardData();

      // Get recent data
      const customerOrders = organization.customerOrders
        .filter((co) => !co.deletedAt)
        .map((co) => ({ order: co, customerId: co.customer_id }))
        .sort((a, b) => dayjs(b.order.createdAt).unix() - dayjs(a.order.createdAt).unix())
        .slice(0, 3);

      const purchases = organization.purchases
        .filter((p) => !p.deletedAt)
        .map((so) => ({ order: so, supplierId: so.supplier_id }))
        .sort((a, b) => dayjs(b.order.createdAt).unix() - dayjs(a.order.createdAt).unix())
        .slice(0, 3);

      // Get notifications
      const notifications = yield* notificationService.findByOrganizationId();

      return {
        orders: {
          customers: {
            values: customerOrders,
          },
          suppliers: {
            values: purchases,
          },
        },
        notifications,
      };
    }).pipe(Effect.provide([OrganizationLive, CustomerOrderLive, NotificationLive])),
    json({
      orders: {
        customers: {
          values: [],
        },
        suppliers: {
          values: [],
        },
      },
      notifications: [],
    }),
  );
}, "dashboard-data");

export const getMostPopularProducts = query(() => {
  "use server";
  return run(
    "@query/most-popular-products",
    Effect.gen(function* (_) {
      const orderService = yield* CustomerOrderService;
      return yield* orderService.findMostPopularProducts();
    }).pipe(Effect.provide(CustomerOrderLive)),
    json([]),
  );
}, "most-popular-products");

export const getLastSoldProducts = query(async () => {
  "use server";

  return run(
    "@query/last-sold-products",
    Effect.gen(function* (_) {
      const organizationService = yield* _(OrganizationService);

      const organization = yield* organizationService.getDashboardData();

      // Get recent data
      const customerOrders = organization.customerOrders
        .filter((co) => !co.deletedAt)
        .map((co) => ({ order: co, customerId: co.customer_id }))
        .sort((a, b) => dayjs(b.order.createdAt).unix() - dayjs(a.order.createdAt).unix())
        .slice(0, 3);

      const lastUsedProductsFromCustomers = customerOrders
        .map((co) => co.order.products)
        .flat()
        .sort((a, b) => dayjs(b.updatedAt).unix() - dayjs(a.updatedAt).unix())
        .slice(0, 3)
        .map((p) => p.product);

      return lastUsedProductsFromCustomers;
    }).pipe(Effect.provide(OrganizationLive)),
    json([]),
  );
}, "last-sold-products");
