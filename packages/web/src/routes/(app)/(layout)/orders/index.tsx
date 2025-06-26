import { CustomersOrdersList } from "@/components/lists/orders";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getCustomerOrders } from "@/lib/api/orders";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { Show, Suspense } from "solid-js";
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
  const data = createAsync(() => getCustomerOrders(), { deferStream: false });

  return (
    <div class="container flex flex-col grow py-4">
      <div class="w-full flex flex-row h-full gap-4">
        <div class="w-full flex flex-col gap-4">
          <div class="flex items-center gap-4 justify-between w-full">
            <div class="flex flex-row items-center gap-4">
              <Button size="sm" as={A} href="/dashboard" variant="outline" class="bg-background">
                <ArrowLeft class="size-4" />
                Back
              </Button>
              <h1 class="font-semibold leading-none">Customer Orders</h1>
            </div>
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
            <Suspense
              fallback={
                <div class="flex flex-col gap-4 w-full">
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                </div>
              }
            >
              <Show when={data()}>{(os) => <CustomersOrdersList data={os} />}</Show>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
