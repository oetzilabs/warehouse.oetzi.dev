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
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import dayjs from "dayjs";
import { Cause, Chunk, Effect, Exit } from "effect";
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

  const dashboardDataExit = await Effect.runPromiseExit(
    Effect.gen(function* (_) {
      const organizationService = yield* _(OrganizationService);
      const orderService = yield* _(CustomerOrderService);
      const notificationService = yield* _(NotificationService);

      const organization = yield* organizationService.getDashboardData(orgId);
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

      const mostPopularProductsFromOrders = yield* orderService.findMostPopularProductsByOrganizationId(
        organization.id,
      );

      // Get chart data
      const customerOrdersChartData = yield* orderService.getCustomerOrdersChartData(organization.id);
      const purchasesChartData = yield* orderService.getSupplierPurchaseChartData(organization.id);
      const popularProductsChartData = yield* orderService.getPopularProductsChartData(organization.id);
      const lastSoldProductsChartData = yield* orderService.getLastSoldProductsChartData(organization.id);

      // Get notifications
      const notifications = yield* notificationService.findByOrganizationId(organization.id);

      return {
        orders: {
          customers: {
            values: customerOrders,
            deltaPercentageLastWeek: customerOrdersPercentageLastWeek,
            chartData: customerOrdersChartData,
          },
          suppliers: {
            values: purchases,
            deltaPercentageLastWeek: purchasesPercentageLastWeek,
            chartData: purchasesChartData,
          },
        },
        lastUsedProductsFromCustomers,
        lastSoldProductsChartData,
        mostPopularProductsFromOrders,
        popularProductsChartData,
        notifications,
      };
    }).pipe(Effect.provide(OrganizationLive), Effect.provide(CustomerOrderLive), Effect.provide(NotificationLive)),
  );

  return Exit.match(dashboardDataExit, {
    onSuccess: (data) => json(data),
    onFailure: (cause) => {
      const errors = Chunk.toReadonlyArray(Cause.failures(cause)).map((c) => c.message);
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
        lastUsedProductsFromCustomers: [],
        lastSoldProductsChartData: {
          labels: [],
          data: [],
        },
        mostPopularProductsFromOrders: [],
        popularProductsChartData: {
          labels: [],
          data: [],
        },
        notifications: [],
      });
    },
  });
}, "dashboard-data");
