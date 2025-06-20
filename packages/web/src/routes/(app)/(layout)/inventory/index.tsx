import { Alerts } from "@/components/features/inventory/alerts";
import { StorageMap } from "@/components/features/inventory/map";
import { InventoryList } from "@/components/lists/inventory";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getInventory, getInventoryAlerts } from "@/lib/api/inventory";
import { cookieStorage, makePersisted } from "@solid-primitives/storage";
import { createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import List from "lucide-solid/icons/list";
import MapIcon from "lucide-solid/icons/map";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createSignal, Match, Show, Switch } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = await getSessionToken();
    const inventories = await getInventory();
    const alerts = await getInventoryAlerts();
    return { user, sessionToken, inventories, alerts };
  },
} as RouteDefinition;

export default function InventoryPage() {
  const data = createAsync(() => getInventory(), { deferStream: true });
  const [view, setView] = makePersisted(createSignal<"list" | "map">("list"), {
    name: "inventory-view",
    storage: cookieStorage,
  });

  return (
    <Show when={data()}>
      {(inventory) => (
        <div class="container flex flex-col grow py-4">
          <div class="w-full flex flex-row h-full gap-4">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="font-semibold leading-none">Inventory Summary</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate([getInventory.key, getInventoryAlerts.key]), {
                        loading: "Refreshing inventory...",
                        success: "Inventory refreshed",
                        error: "Failed to refresh inventory",
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
                <Alerts />
                <div class="flex flex-row items-center justify-end gap-4">
                  <Button
                    size="sm"
                    variant="outline"
                    class="bg-background"
                    onClick={() => {
                      setView((v) => (v === "list" ? "map" : "list"));
                    }}
                  >
                    <Show when={view() === "list"}>
                      <>
                        <span>List</span>
                        <List class="size-4" />
                      </>
                    </Show>
                    <Show when={view() !== "list"}>
                      <>
                        <span>Map</span>
                        <MapIcon class="size-4" />
                      </>
                    </Show>
                  </Button>
                </div>
                <Switch>
                  <Match when={view() === "list"}>
                    <InventoryList inventory={inventory} />
                  </Match>
                  <Match when={view() === "map"}>
                    <StorageMap inventory={inventory} />
                  </Match>
                </Switch>
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
