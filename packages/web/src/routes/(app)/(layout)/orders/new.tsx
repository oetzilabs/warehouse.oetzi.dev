import { NewOrderForm } from "@/components/forms/orders/new";
import { getCustomers } from "@/lib/api/customers";
import { getProducts } from "@/lib/api/products";
import { createAsync } from "@solidjs/router";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show, Suspense } from "solid-js";

export default function NewOrderPage() {
  const customers = createAsync(() => getCustomers(), { deferStream: true });
  const products = createAsync(() => getProducts(), { deferStream: true });

  return (
    <div class="p-4 flex flex-col gap-0 relative container">
      <div class="flex items-center justify-between bg-background pb-2">
        <div class="flex items-center gap-4">
          <h1 class="text-lg font-semibold">New Order</h1>
        </div>
      </div>
      <Suspense
        fallback={
          <div class="flex items-center justify-center p-8 gap-2 text-sm text-muted-foreground">
            <Loader2 class="size-4 animate-spin" />
            <span class="text-sm">Loading customers & products...</span>
          </div>
        }
      >
        <Show when={customers() && products()}>
          <NewOrderForm
            customers={(customers() ?? []).map((c) => ({ id: c.id, name: c.name }))}
            products={(products() ?? []).map((p) => ({
              product: { id: p.product.id, name: p.product.name },
              sellingPrice: p.sellingPrice,
              currency: p.currency,
              taxGroupName: p.taxGroupName!,
              taxGroupRate: p.taxGroupRate!,
            }))}
          />
        </Show>
      </Suspense>
    </div>
  );
}
