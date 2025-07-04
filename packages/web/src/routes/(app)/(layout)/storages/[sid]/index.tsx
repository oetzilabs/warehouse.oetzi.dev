import { StorageStatisticsList } from "@/components/lists/storages";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getInventoryFromStorage } from "@/lib/api/inventory";
import { createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import dayjs from "dayjs";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser();
    const sessionToken = getSessionToken();
    const inventories = getInventoryFromStorage(props.params.sid);
    return { user, sessionToken, inventories };
  },
} as RouteDefinition;

export default function InventoryPage() {
  const params = useParams();
  const data = createAsync(() => getInventoryFromStorage(params.sid), { deferStream: true });

  return (
    <Show when={data()}>
      {(os) => (
        <div class="container flex flex-col grow py-0 relative">
          <div class="w-full flex flex-row h-full gap-4">
            <div class="w-full flex flex-col gap-4">
              <div class="sticky top-12 z-10 flex items-center gap-4 justify-between w-full bg-background pb-4">
                <h1 class="font-semibold leading-none">Inventory Summary</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate(getInventoryFromStorage.key), {
                        loading: "Refreshing Storage...",
                        success: "Storage refreshed",
                        error: "Failed to refresh storage",
                      });
                    }}
                  >
                    <RotateCw class="size-4" />
                  </Button>
                  <Button size="sm" class="pl-2.5 rounded-l-none">
                    <Plus class="size-4" />
                    <span class="sr-only md:not-sr-only">Create</span>
                  </Button>
                </div>
              </div>
              <div class="flex flex-col gap-4 w-full grow">
                <StorageStatisticsList storages={os} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
