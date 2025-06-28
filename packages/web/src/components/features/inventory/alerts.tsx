import { Reorder } from "@/components/features/products/reorder";
import { LastOrderInfo } from "@/components/last-order-info";
import { Button } from "@/components/ui/button";
import { getInventory, getInventoryAlerts } from "@/lib/api/inventory";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import PackageSearch from "lucide-solid/icons/package-search";
import { For, Show, Suspense } from "solid-js";
import { Skeleton } from "../../ui/skeleton";

export const Alerts = () => {
  const alertsData = createAsync(() => getInventoryAlerts(), { deferStream: true });
  return (
    <div class="flex flex-col gap-4">
      <h2 class="font-semibold text-lg">Alerts</h2>
      <Suspense
        fallback={
          <div class="flex flex-col items-center w-full border rounded-lg overflow-hidden bg-muted-foreground/[0.025] dark:bg-muted/15">
            <div class="border-b last:border-b-0 w-full p-4">
              <div class="flex-1 flex flex-col gap-4">
                <div class="flex-1 flex flex-col gap-2">
                  <div class="flex flex-row items-center justify-between gap-2">
                    <Skeleton class="font-semibold w-20 h-6"></Skeleton>
                    <Skeleton class="text-sm text-muted-foreground w-10 h-6"></Skeleton>
                  </div>
                  <div class="flex flex-row items-center gap-2">
                    <Skeleton class="text-sm text-muted-foreground w-20 h-6"></Skeleton>
                  </div>
                </div>
                <div class="flex flex-row items-center gap-2">
                  <div class="w-full">
                    <Skeleton class="text-sm text-muted-foreground w-80 h-6"></Skeleton>
                  </div>
                  <div class="flex flex-row items-center gap-2">
                    <Skeleton class="w-32 h-8"></Skeleton>
                    <Skeleton class="w-32 h-8"></Skeleton>
                  </div>
                </div>
              </div>
            </div>
            <div class="w-full p-4">
              <div class="flex-1 flex flex-col gap-4">
                <div class="flex-1 flex flex-col gap-2">
                  <div class="flex flex-row items-center justify-between gap-2">
                    <Skeleton class="font-semibold w-20 h-6"></Skeleton>
                    <Skeleton class="text-sm text-muted-foreground w-10 h-6"></Skeleton>
                  </div>
                  <div class="flex flex-row items-center gap-2">
                    <Skeleton class="text-sm text-muted-foreground w-20 h-6"></Skeleton>
                  </div>
                </div>
                <div class="flex flex-row items-center gap-2">
                  <div class="w-full">
                    <Skeleton class="text-sm text-muted-foreground w-80 h-6"></Skeleton>
                  </div>
                  <div class="flex flex-row items-center gap-2">
                    <Skeleton class="w-32 h-8"></Skeleton>
                    <Skeleton class="w-32 h-8"></Skeleton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <Show when={alertsData()}>
          {(alerts) => (
            <div class="flex flex-col items-center w-full border rounded-lg overflow-hidden">
              <For each={alerts()}>
                {(a) => (
                  <div class="flex flex-row gap-4 items-center w-full border-b last:border-b-0 p-4 bg-muted-foreground/[0.025] dark:bg-muted/15">
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
          )}
        </Show>
      </Suspense>
    </div>
  );
};
