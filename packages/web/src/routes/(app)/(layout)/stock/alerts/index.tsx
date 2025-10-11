import { Loader } from "@/components/features/loader";
import { LastOrderInfo } from "@/components/last-order-info";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getInventoryAlertsHistory } from "@/lib/api/inventory";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import AlertCircle from "lucide-solid/icons/alert-circle";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import PackageOpen from "lucide-solid/icons/package-open";
import PackageSearch from "lucide-solid/icons/package-search";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { For } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const alerts = await getInventoryAlertsHistory();
    return { user, sessionToken, alerts };
  },
} as RouteDefinition;

export default function InventoryPage() {
  const alertsData = createAsync(() => getInventoryAlertsHistory(), { deferStream: true });

  return (
    <div class="flex flex-col-reverse md:flex-row w-full h-content md:h-full gap-0 overflow-auto lg:overflow-hidden">
      <div class="w-full flex flex-col h-content gap-4 p-4 md:overflow-auto">
        <div class="w-full flex flex-col gap-4">
          <div class="flex items-center gap-4 justify-between w-full bg-background">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <PackageOpen class="size-4" />
              </div>
              <h1 class="font-semibold leading-none">Stock</h1>
            </div>
            <div class="flex items-center gap-2">
              <Button size="sm" as={A} href="/stock/alerts">
                <span class="sr-only lg:not-sr-only">Previous Alerts</span>
                <ArrowUpRight class="size-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                class="bg-background"
                onClick={() => {
                  toast.promise(revalidate([getInventoryAlertsHistory.key]), {
                    loading: "Refreshing inventory...",
                    success: "Inventory refreshed",
                    error: "Failed to refresh inventory",
                  });
                }}
              >
                <RotateCw class="size-4" />
                <span class="sr-only md:not-sr-only">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
        <div class="w-full flex flex-row h-content gap-4 md:overflow-auto">
          <div class="flex flex-col gap-2 w-full">
            <Loader
              query={alertsData}
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
              {(alerts) => (
                <div class="flex flex-col items-center w-full  overflow-hidden gap-4">
                  <For
                    each={alerts()}
                    fallback={
                      <div class="flex flex-col items-center justify-center h-full bg-muted-foreground/[0.025] dark:bg-muted/15 w-full">
                        <div class="w-full h-full flex items-center justify-center p-4 ">
                          <div class="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                            All stock levels look good!
                          </div>
                        </div>
                      </div>
                    }
                  >
                    {(a) => (
                      <div class="flex flex-row gap-4 items-center w-full border rounded-lg p-4 bg-muted-foreground/[0.025] dark:bg-muted/15">
                        <div class="flex-1 flex flex-row gap-4">
                          <div class="size-6 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                            <AlertCircle class="size-3" />
                          </div>
                          <div class="flex flex-col flex-1 gap-4">
                            <div class="flex-1 flex flex-col gap-2">
                              <div class="flex flex-row items-baseline justify-between gap-2">
                                <div class="font-semibold word-wrap">{a.product.name}</div>
                                <div class="text-sm text-muted-foreground flex-1">
                                  {a.count}/{a.product.minimumStock}
                                </div>
                              </div>
                              <div class="flex flex-row items-center gap-2">
                                <div class="flex-1 text-sm text-muted-foreground">{a.product.description}</div>
                              </div>
                            </div>
                            <div class="flex-1 text-sm text-muted-foreground items-center">
                              <LastOrderInfo product={a.product} />
                            </div>
                            <div class="flex flex-row items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                class="bg-background"
                                as={A}
                                href={`/stock/update/${a.product.id}`}
                              >
                                <span class="sr-only xl:not-sr-only">Update Inventory</span>
                                <PackageSearch class="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              )}
            </Loader>
          </div>
        </div>
      </div>
    </div>
  );
}
