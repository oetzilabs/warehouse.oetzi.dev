import { OrdersDataTable } from "@/components/orders/orders-data-table";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getOrdersByWarehouseId } from "@/lib/api/orders";
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
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const orders = getOrdersByWarehouseId(props.params.whid);
    return { user, sessionToken, orders };
  },
} as RouteDefinition;

export default function MapPage() {
  const params = useParams();
  const orders = createAsync(() => getOrdersByWarehouseId(params.whid), { deferStream: true, initialValue: [] });
  const [selectedOrder, setSelectedOrder] = createSignal<OrderInfo | null>(null);
  const [previewVisible, setPreviewVisible] = createSignal(false);

  const calculateOrders = (orders: OrderInfo[]) => {
    // Calculate total sales for each day
    const totalSales = orders.reduce(
      (acc, order) => {
        const date = dayjs(order.createdAt).format("YYYY-MM-DD");
        if (!order.sale) return acc;
        if (acc[date]) {
          acc[date] += order.sale.total;
        } else {
          acc[date] = order.sale.total;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      labels: Object.keys(totalSales),
      datasets: [
        {
          label: "Daily Orders Total",
          data: Object.values(totalSales),
          fill: true,
          pointStyle: false,
        },
      ],
    };
  };

  return (
    <Suspense fallback={<div class="p-4 w-full">Loading...</div>}>
      <Show when={orders()}>
        {(os) => (
          <div class="container flex flex-col grow py-4">
            <div class="w-full flex flex-row h-full border rounded-xl">
              <div class="w-full flex flex-col gap-4">
                <div class="flex items-center gap-4 justify-between w-full border-b p-4">
                  <h1 class="font-semibold leading-none text-muted-foreground">Customer Orders</h1>
                  <div class="flex items-center gap-0">
                    <Button
                      size="icon"
                      variant="outline"
                      class="w-9 h-8 rounded-r-none bg-background"
                      onClick={() => {
                        toast.promise(revalidate(getOrdersByWarehouseId.keyFor(params.whid)), {
                          loading: "Refreshing orders...",
                          success: "Orders refreshed",
                          error: "Failed to refresh orders",
                        });
                      }}
                    >
                      <RotateCw class="size-4" />
                    </Button>
                    <Button size="sm" class="h-8 pl-2.5 rounded-l-none">
                      <Plus class="size-4" />
                      Create
                    </Button>
                  </div>
                </div>
                <div class="flex flex-col gap-2 w-full grow px-4">
                  <div class="flex flex-col gap-2 w-full rounded-lg border h-60">
                    <Show
                      when={os().length > 0}
                      fallback={
                        <div class="flex flex-col gap-2 w-full h-full items-center justify-center bg-muted-foreground/5 ">
                          <div class="flex flex-col gap-4 items-center justify-center text-muted-foreground select-none">
                            <span class="text-sm">No customer-orders data available</span>
                          </div>
                        </div>
                      }
                    >
                      <div class="flex flex-col gap-2 w-full h-full">
                        <LineChart data={calculateOrders(os().map((o) => o.order))} />
                      </div>
                    </Show>
                  </div>
                  <Show when={os().length > 0}>
                    <OrdersDataTable
                      data={() => os().map((o) => o.order)}
                      onSelectedOrder={(order) => {
                        setSelectedOrder(order);
                        setPreviewVisible(true);
                      }}
                    />
                  </Show>
                </div>
              </div>
              <div
                class={cn("w-full lg:max-w-lg border-l lg:flex hidden flex-col grow", {
                  "!hidden": !previewVisible(),
                })}
              >
                <div class="w-full flex flex-row gap-4 items-center justify-between border-b p-4">
                  <h2 class="font-semibold leading-none text-muted-foreground">Preview Orders</h2>
                  <Button
                    size="icon"
                    variant="secondary"
                    class="size-8"
                    onClick={() => {
                      setPreviewVisible(false);
                    }}
                  >
                    <X class="size-4" />
                  </Button>
                </div>
                <For
                  each={selectedOrder()?.products}
                  fallback={
                    <div class="p-4 w-full grow flex flex-col">
                      <div class="flex flex-col gap-4 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border text-muted-foreground">
                        <PackageSearch class="size-10 text-muted-foreground/50" stroke-width={1} />
                        <span class="text-sm">No order selected</span>
                      </div>
                    </div>
                  }
                >
                  {(p) => (
                    <div class="p-4 w-full flex flex-col gap-4">
                      <div class="flex items-center gap-4 justify-between w-full">
                        <h1 class="text-2xl font-bold mb-4">{p.product.name}</h1>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
}
