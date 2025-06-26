import { PurchasesList } from "@/components/lists/orders";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getPurchases } from "@/lib/api/purchases";
import { A, createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { type SupplierPurchaseInfo } from "@warehouseoetzidev/core/src/entities/suppliers";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { Show } from "solid-js";
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

  const calculateOrders = (orders: SupplierPurchaseInfo[]) => {
    const ordersByDay = orders.reduce(
      (acc, order) => {
        const date = dayjs(order.createdAt).format("YYYY-MM-DD");
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
                <div class="flex flex-row items-center gap-4">
                  <Button size="sm" as={A} href="/dashboard" variant="outline" class="bg-background">
                    <ArrowLeft class="size-4" />
                    Back
                  </Button>
                  <h1 class="font-semibold leading-none">Purchases</h1>
                </div>
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
              <PurchasesList data={os} />
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
