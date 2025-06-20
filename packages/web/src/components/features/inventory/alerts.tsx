import { Reorder } from "@/components/features/products/reorder";
import { LastOrderInfo } from "@/components/last-order-info";
import { Button } from "@/components/ui/button";
import { getInventory, getInventoryAlerts } from "@/lib/api/inventory";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import PackageSearch from "lucide-solid/icons/package-search";
import { For, Show, Suspense } from "solid-js";

export const Alerts = () => {
  const alertsData = createAsync(() => getInventoryAlerts(), { deferStream: true });
  return (
    <Suspense>
      <Show when={alertsData()}>
        {(alerts) => (
          <div class="flex flex-col gap-4">
            <h2 class="font-semibold text-lg">Alerts</h2>
            <div class="flex flex-col items-center w-full border rounded-lg overflow-hidden">
              <For each={alerts()}>
                {(a) => (
                  <div class="flex flex-row gap-4 items-center w-full border-b last:border-b-0 p-4">
                    <div class="flex-1 flex flex-col gap-4">
                      <div class="flex-1 flex flex-col gap-2">
                        <div class="flex flex-row items-center gap-2">
                          <div class="flex-1 font-semibold">{a.product.name}</div>
                          <div class="text-sm text-muted-foreground">
                            {a.count}/{a.product.minimumStock}
                          </div>
                        </div>
                        <div class="flex flex-row items-center gap-2">
                          <div class="flex-1 text-sm text-muted-foreground">{a.product.description}</div>
                        </div>
                      </div>
                      <div class="flex flex-row items-center gap-2">
                        <div class="flex-1 text-sm text-muted-foreground">
                          <LastOrderInfo product={a.product} />
                        </div>
                        <div class="flex flex-row items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            class="bg-background"
                            as={A}
                            href={`/inventory/update/${a.product.id}`}
                          >
                            <span class="sr-only lg:not-sr-only">Update Inventory</span>
                            <PackageSearch class="size-4" />
                          </Button>
                          <Reorder
                            product={() => ({
                              ...a.product,
                              preferredDate: a.product.lastPurchase.createdAt,
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
};
