import { CustomersOrdersList } from "@/components/orders-list";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getCustomerById } from "@/lib/api/customers";
import { A, createAsync, RouteDefinition, useParams } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show, Suspense } from "solid-js";

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getCustomerById(props.params.csid);
  },
} as RouteDefinition;

export default function CustomerOrdersPage() {
  const params = useParams();
  const data = createAsync(() => getCustomerById(params.csid));

  return (
    <Suspense
      fallback={
        <div class="w-full h-full flex items-center justify-center flex-col gap-2">
          <Loader2 class="size-4 animate-spin" />
          <span class="text-sm">Loading...</span>
        </div>
      }
    >
      <Show when={data()}>
        {(customerInfo) => (
          <div class="flex flex-col gap-4 p-4">
            <div class="flex flex-row items-center justify-between gap-4">
              <div class="flex flex-row items-center gap-4">
                <Button variant="outline" size="sm" as={A} href={`/customers/${params.csid}`}>
                  <ArrowLeft class="size-4" />
                  Back
                </Button>
                <h1 class="font-semibold leading-none">Orders for {customerInfo().customer.name}</h1>
              </div>
            </div>
            <CustomersOrdersList
              data={() =>
                customerInfo().orders.map((o) => ({
                  customer_id: params.csid,
                  order: o.order,
                  createdAt: o.createdAt,
                }))
              }
            />
          </div>
        )}
      </Show>
    </Suspense>
  );
}
