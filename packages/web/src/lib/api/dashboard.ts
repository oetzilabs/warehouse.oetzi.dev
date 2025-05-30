import { action, json, query, redirect } from "@solidjs/router";
import {
  NotificationInfo,
  NotificationLive,
  NotificationService,
} from "@warehouseoetzidev/core/src/entities/notifications";
import { OrderLive, OrderService } from "@warehouseoetzidev/core/src/entities/orders";
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
      const orderService = yield* _(OrderService);
      const notificationService = yield* _(NotificationService);

      const organization = yield* organizationService.findById(orgId);
      if (!organization) {
        throw new Error("Organization not found");
      }

      // we gotta get the customerOrders, supplierOrders, and other notifications
      const customerOrders = organization.customerOrders
        .map((co) => ({ order: co.order, customerId: co.customer_id }))
        .sort((a, b) => dayjs(b.order.createdAt).unix() - dayjs(a.order.createdAt).unix())
        .slice(0, 3);
      const supplierOrders = organization.supplierOrders
        .map((so) => ({ order: so.order, supplierId: so.supplier_id }))
        .sort((a, b) => dayjs(b.order.createdAt).unix() - dayjs(a.order.createdAt).unix())
        .slice(0, 3);

      const lastUsedProductsFromCustomers = customerOrders
        .map((co) => co.order.prods)
        .flat()
        .sort((a, b) => dayjs(b.updatedAt).unix() - dayjs(a.updatedAt).unix())
        .slice(0, 3);

      const customerOrdersPercentageLastWeek = yield* orderService.percentageCustomerOrdersLastWeekByOrganizationId(
        organization.id,
      );

      const supplierOrdersPercentageLastWeek = yield* orderService.percentageSupplierOrdersLastWeekByOrganizationId(
        organization.id,
      );

      const mostPopularProductsFromOrders = yield* orderService.findMostPopularProductsByOrganizationId(
        organization.id,
      );

      const customerOrdersChartData = yield* orderService.getCustomerOrdersChartData(organization.id);
      const supplierOrdersChartData = yield* orderService.getSupplierOrdersChartData(organization.id);
      const popularProductsChartData = yield* orderService.getPopularProductsChartData(organization.id);
      const lastSoldProductsChartData = yield* orderService.getLastSoldProductsChartData(organization.id);

      // const syncNotifications = yield* notificationService.sync();

      const notifications = yield* notificationService.findByOrganizationId(organization.id);

      return {
        orders: {
          customers: {
            values: customerOrders,
            deltaPercentageLastWeek: customerOrdersPercentageLastWeek,
            chartData: customerOrdersChartData,
          },
          suppliers: {
            values: supplierOrders,
            deltaPercentageLastWeek: supplierOrdersPercentageLastWeek,
            chartData: supplierOrdersChartData,
          },
        },
        lastUsedProductsFromCustomers,
        lastSoldProductsChartData,
        mostPopularProductsFromOrders,
        popularProductsChartData,
        notifications,
      };
    }).pipe(Effect.provide(OrganizationLive), Effect.provide(OrderLive), Effect.provide(NotificationLive)),
  );
  return Exit.match(dashboardDataExit, {
    onSuccess: (data) => {
      return json(data);
    },
    onFailure: (cause) => {
      const causes = Cause.failures(cause);
      const errors = Chunk.toReadonlyArray(causes).map((c) => {
        return c.message;
      });
      console.log(errors);
      return json({
        orders: {
          customers: {
            values: [] as { customerId: string; order: OrganizationInfo["customerOrders"][number]["order"] }[],
            deltaPercentageLastWeek: 0,
            chartData: [],
          },
          suppliers: {
            values: [] as { supplierId: string; order: OrganizationInfo["supplierOrders"][number]["order"] }[],
            deltaPercentageLastWeek: 0,
            chartData: [],
          },
        },
        lastUsedProductsFromCustomers: [] as OrganizationInfo["customerOrders"][number]["order"]["prods"],
        lastSoldProductsChartData: {
          labels: [],
          data: [],
        },
        mostPopularProductsFromOrders: [] as Effect.Effect.Success<
          ReturnType<OrderService["findMostPopularProductsByOrganizationId"]>
        >,
        popularProductsChartData: {
          labels: [],
          data: [],
        },
        notifications: [] as NotificationInfo[],
      });
      // throw new Error(`Some error(s) occurred: ${errors.join(", ")}`);
    },
  });
}, "dashboard-data");
