import { Alerts } from "@/components/features/inventory/alerts";
import { StorageMap } from "@/components/features/inventory/map";
import { InventoryList } from "@/components/lists/inventory";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getInventory, getInventoryAlerts } from "@/lib/api/inventory";
import { cookieStorage, makePersisted } from "@solid-primitives/storage";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import List from "lucide-solid/icons/list";
import MapIcon from "lucide-solid/icons/map";
import PackageOpen from "lucide-solid/icons/package-open";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createSignal, Match, Show, Switch } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const inventories = await getInventory();
    const alerts = await getInventoryAlerts();
    return { user, sessionToken, inventories, alerts };
  },
} as RouteDefinition;

export default function InventoryPage() {
  const data = createAsync(() => getInventory(), { deferStream: true });

  return (
    <Show when={data()}>
      {(inventory) => (
        <div class="container flex flex-col grow py-0 relative">
          <div class="w-full flex flex-row h-full gap-4">
            <div class="w-full flex flex-col gap-0">
              <div class="sticky top-12 z-10 flex items-center gap-4 justify-between w-full bg-background pb-8">
                <div class="flex flex-row items-center gap-4">
                  <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                    <PackageOpen class="size-4" />
                  </div>
                  <h1 class="font-semibold leading-none">Stock</h1>
                </div>
                <div class="flex items-center gap-0">
                  <Button
                    size="sm"
                    variant="outline"
                    class="bg-background"
                    onClick={() => {
                      toast.promise(revalidate([getInventory.key, getInventoryAlerts.key]), {
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
              <Alerts />
              <div class="flex flex-col gap-4 w-full grow pt-4">
                <InventoryList inventory={inventory} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
