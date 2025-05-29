import { CustomersOrdersList } from "@/components/orders-list";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getCustomerOrders } from "@/lib/api/orders";
import { createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import { OrderInfo } from "@warehouseoetzidev/core/src/entities/orders";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createSignal, Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const orders = getCustomerOrders();
    return { user, sessionToken, orders };
  },
} as RouteDefinition;

export default function CustomerOrdersPage() {
  const data = createAsync(() => getCustomerOrders(), { deferStream: true });
  const [selectedOrder, setSelectedOrder] = createSignal<OrderInfo | null>(null);
  const [previewVisible, setPreviewVisible] = createSignal(false);

  return (
    <Show when={data()}>
      {(os) => (
        <div class="container flex flex-col grow py-4">
          <div class="w-full flex flex-row h-full gap-4">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="font-semibold leading-none">Customer Orders</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate(getCustomerOrders.key), {
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
              <div class="flex flex-col gap-4 w-full grow">
                <div class="flex flex-col gap-4 w-full rounded-lg border h-60">
                  {/* <div class="flex flex-col gap-4 w-full h-full p-4">
                    <LineChart data={calculateOrders(os())} />
                  </div> */}
                </div>
                <CustomersOrdersList data={os} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
