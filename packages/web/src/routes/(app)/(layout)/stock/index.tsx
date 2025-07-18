import { Alerts } from "@/components/features/inventory/alerts";
import { StorageMap } from "@/components/features/inventory/map";
import { Loader } from "@/components/features/loader";
import { InventoryList } from "@/components/lists/inventory";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getInventory, getInventoryAlerts } from "@/lib/api/inventory";
import { cookieStorage, makePersisted } from "@solid-primitives/storage";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
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
    <div class="flex flex-col-reverse md:flex-row w-full grow gap-0 overflow-auto lg:overflow-hidden">
      <div class="w-full flex flex-row h-full gap-4 p-4 border-r-0 md:border-r md:overflow-auto">
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
          <div class="flex flex-col gap-4 w-full grow">
            <Loader query={data}>{(inventory) => <InventoryList inventory={inventory} />}</Loader>
          </div>
        </div>
      </div>
      <div class="flex flex-col w-full md:w-[500px] p-4 md:overflow-auto border-b md:border-b-0 h-content">
        <Alerts />
      </div>
    </div>
  );
}
