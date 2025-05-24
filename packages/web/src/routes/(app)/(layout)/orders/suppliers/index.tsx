import { SuppliersOrdersList } from "@/components/orders-list";
import { OrdersDataTable } from "@/components/orders/orders-data-table";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getSupplyOrders } from "@/lib/api/orders";
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
    const orders = getSupplyOrders();
    return { user, sessionToken, orders };
  },
} as RouteDefinition;

export default function SuppliersOrderPage() {
  const params = useParams();
  const orders = createAsync(() => getSupplyOrders(), { deferStream: true, initialValue: [] });

  // const calculateOrders = (orders: OrderInfo[]) => {
  //   // Calculate total sales for each day
  //   const totalSales = orders.reduce(
  //     (acc, order) => {
  //       const date = dayjs(order.createdAt).format("YYYY-MM-DD");
  //       if (!order.sale) return acc;
  //       if (acc[date]) {
  //         acc[date] += order.sale.total;
  //       } else {
  //         acc[date] = order.sale.total;
  //       }
  //       return acc;
  //     },
  //     {} as Record<string, number>,
  //   );

  //   return {
  //     labels: Object.keys(totalSales),
  //     datasets: [
  //       {
  //         label: "Daily Orders Total",
  //         data: Object.values(totalSales),
  //         fill: true,
  //         pointStyle: false,
  //       },
  //     ],
  //   };
  // };

  return (
    <Show when={orders()}>
      {(os) => (
        <div class="container flex flex-col grow py-4">
          <div class="w-full flex flex-row h-full ">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="font-semibold leading-none">Supply Orders</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate(getSupplyOrders.key), {
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
                  {/* <div class="flex flex-col gap-2 w-full h-full p-4">
                    <LineChart data={calculateOrders(os())} />
                  </div> */}
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
