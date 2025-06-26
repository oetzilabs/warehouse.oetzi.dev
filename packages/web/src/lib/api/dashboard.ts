import { action, json, query, redirect } from "@solidjs/router";
import {
  NotificationInfo,
  NotificationLive,
  NotificationService,
} from "@warehouseoetzidev/core/src/entities/notifications";
import { CustomerOrderLive, CustomerOrderService } from "@warehouseoetzidev/core/src/entities/orders";
import {
  OrganizationInfo,
  OrganizationLive,
  OrganizationService,
} from "@warehouseoetzidev/core/src/entities/organizations";
import { OrganizationId } from "@warehouseoetzidev/core/src/entities/organizations/id";
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import dayjs from "dayjs";
import { Cause, Chunk, Effect, Exit, Layer } from "effect";
import { withSession } from "./session";

export const getDashboardData = query(async () => {
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
  const organizationId = Layer.succeed(OrganizationId, orgId);

  const dashboardDataExit = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const organizationService = yield* _(OrganizationService);
      const orderService = yield* _(CustomerOrderService);
      const notificationService = yield* _(NotificationService);

      const organization = yield* organizationService.getDashboardData();
      if (!organization) {
        throw new Error("Organization not found");
      }

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

      const lastUsedProductsFromCustomers = customerOrders
        .map((co) => co.order.products)
        .flat()
        .sort((a, b) => dayjs(b.updatedAt).unix() - dayjs(a.updatedAt).unix())
        .slice(0, 3)
        .map((p) => p.product);

      // Get analytics data
      const customerOrdersPercentageLastWeek = yield* orderService.percentageCustomerOrdersLastWeekByOrganizationId(
        organization.id,
      );

      const purchasesPercentageLastWeek = yield* orderService.percentageSupplierPurchasesLastWeekByOrganizationId(
        organization.id,
      );

      // Get notifications
      const notifications = yield* notificationService.findByOrganizationId(organization.id);

      return {
        orders: {
          customers: {
            values: customerOrders,
            deltaPercentageLastWeek: customerOrdersPercentageLastWeek,
          },
          suppliers: {
            values: purchases,
            deltaPercentageLastWeek: purchasesPercentageLastWeek,
          },
        },
        notifications,
      };
    }).pipe(
      Effect.provide(OrganizationLive),
      Effect.provide(CustomerOrderLive),
      Effect.provide(NotificationLive),
      Effect.provide(organizationId),
    ),
  );

  return Exit.match(dashboardDataExit, {
    onSuccess: (data) => json(data),
    onFailure: (cause) => {
      console.error("Dashboard data errors:", cause);
      const errors = Chunk.toReadonlyArray(Cause.failures(cause));
      console.error("Dashboard data errors:", errors);

      // Return empty data structure on error
      return json({
        orders: {
          customers: {
            values: [],
            deltaPercentageLastWeek: 0,
            chartData: [],
          },
          suppliers: {
            values: [],
            deltaPercentageLastWeek: 0,
            chartData: [],
          },
        },
        notifications: [],
      });
    },
  });
}, "dashboard-data");

export const getMostPopularProducts = query(async () => {
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
  const organizationId = Layer.succeed(OrganizationId, orgId);

  const mostPopularProductsExit = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const orderService = yield* _(CustomerOrderService);

      const mostPopularProducts = yield* orderService.findMostPopularProductsByOrganizationId(orgId);

      return yield* Effect.succeed(mostPopularProducts);
    }).pipe(Effect.provide(CustomerOrderLive), Effect.provide(organizationId)),
  );

  return Exit.match(mostPopularProductsExit, {
    onSuccess: (data) => json(data),
    onFailure: (cause) => {
      console.error("Most popular products errors:", cause);
      const errors = Chunk.toReadonlyArray(Cause.failures(cause));
      console.error("Most popular products errors:", errors);

      // Return empty data structure on error
      return json([]);
    },
  });
}, "most-popular-products");

export const getLastSoldProducts = query(async () => {
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
  const organizationId = Layer.succeed(OrganizationId, orgId);

  const lastSoldProductsExit = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const organizationService = yield* _(OrganizationService);

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

      const lastUsedProductsFromCustomers = customerOrders
        .map((co) => co.order.products)
        .flat()
        .sort((a, b) => dayjs(b.updatedAt).unix() - dayjs(a.updatedAt).unix())
        .slice(0, 3)
        .map((p) => p.product);

      return yield* Effect.succeed(lastUsedProductsFromCustomers);
    }).pipe(Effect.provide(OrganizationLive), Effect.provide(organizationId)),
  );

  return Exit.match(lastSoldProductsExit, {
    onSuccess: (data) => json(data),
    onFailure: (cause) => {
      console.error("Last sold products errors:", cause);
      const errors = Chunk.toReadonlyArray(Cause.failures(cause));
      console.error("Last sold products errors:", errors);

      // Return empty data structure on error
      return json([]);
    },
  });
}, "last-sold-products");
