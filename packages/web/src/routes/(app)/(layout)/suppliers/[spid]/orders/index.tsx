import { PurchasesList } from "@/components/orders-list";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getSupplierById } from "@/lib/api/suppliers";
import { A, createAsync, RouteDefinition, useParams } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show, Suspense } from "solid-js";

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getSupplierById(props.params.spid);
  },
} as RouteDefinition;

export default function SupplierOrdersPage() {
  const params = useParams();
  const data = createAsync(() => getSupplierById(params.spid));

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
        {(supplierInfo) => (
          <div class="flex flex-col gap-4 p-4 container">
            <div class="flex flex-row items-center justify-between gap-4">
              <div class="flex flex-row items-center gap-4">
                <Button variant="outline" size="sm" as={A} href={`/suppliers/${params.spid}`}>
                  <ArrowLeft class="size-4" />
                  Back
                </Button>
                <h1 class="font-semibold leading-none">Orders for {supplierInfo().supplier.name}</h1>
              </div>
            </div>
            <PurchasesList data={() => supplierInfo().orders} />
          </div>
        )}
      </Show>
    </Suspense>
  );
}
