import { SuppliersOrdersList } from "@/components/orders-list";
import { OrdersDataTable } from "@/components/orders/orders-data-table";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getPurchases } from "@/lib/api/orders";
import { cn } from "@/lib/utils";
import { createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { OrderInfo } from "@warehouseoetzidev/core/src/entities/orders";
import dayjs from "dayjs";
import PackageSearch from "lucide-solid/icons/package-search";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import X from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser();
    const sessionToken = getSessionToken();
    const orders = getPurchases();
    return { user, sessionToken, orders };
  },
} as RouteDefinition;

export default function PurchasesPage() {
  const params = useParams();
  const orders = createAsync(() => getPurchases(), { deferStream: true, initialValue: [] });

  const calculateOrders = (orders: { supplier_id: string; order: OrderInfo; createdAt: Date }[]) => {
    const ordersByDay = orders.reduce(
      (acc, order) => {
        const date = dayjs(order.order.createdAt).format("YYYY-MM-DD");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const sortedDates = Object.keys(ordersByDay).sort((a, b) => dayjs(a).diff(dayjs(b)));
    const last30Days = sortedDates.slice(-30);

    return {
      labels: last30Days.map((d) => dayjs(d).format("MMM D")),
      datasets: [
        {
          label: "Orders per Day",
          data: last30Days.map((date) => ordersByDay[date] || 0),
          fill: true,
          pointStyle: false,
          tension: 0.4,
          borderColor: "rgba(99, 102, 241, 1)",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          borderWidth: 2,
        },
      ],
      options: {
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
          },
          x: {
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
          },
        },
      },
    };
  };

  return (
    <Show when={orders()}>
      {(os) => (
        <div class="container flex flex-col grow py-4">
          <div class="w-full flex flex-row h-full ">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="font-semibold leading-none">Purchases</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate(getPurchases.key), {
                        loading: "Refreshing orders...",
                        success: "Orders refreshed",
                        error: "Failed to refresh orders",
                      });
                    }}
                  >
                    <RotateCw class="size-4" />
                  </Button>
                  <Button size="sm" class="pl-2.5 rounded-l-none">
                    <Plus class="size-4" />
                    Create
                  </Button>
                </div>
              </div>
              <div class="flex flex-col gap-4 w-full grow ">
                <div class="flex flex-col gap-4 w-full rounded-lg border h-60">
                  <div class="flex flex-col gap-4 w-full h-full p-4">
                    <LineChart data={calculateOrders(os())} />
                  </div>
                </div>
                <SuppliersOrdersList data={os} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
