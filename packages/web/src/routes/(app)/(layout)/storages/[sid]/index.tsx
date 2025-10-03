import { StorageStatisticsList } from "@/components/lists/storages";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getInventoryFromStorage } from "@/lib/api/inventory";
import { createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import dayjs from "dayjs";
import PackageOpen from "lucide-solid/icons/package-open";
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
    <div class="flex flex-row w-full grow p-4 gap-2">
      <div class="w-full flex flex-row h-full gap-4">
        <div class="w-full flex flex-col gap-0">
          <div class="flex items-center gap-4 justify-between w-full bg-background pb-2">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <PackageOpen class="size-4" />
              </div>
              <h1 class="font-semibold leading-none">Inventory Summary</h1>
            </div>
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
          <Show when={data()}>
            {(os) => (
              <div class="flex flex-col gap-4 w-full grow">
                <StorageStatisticsList storages={os} />
              </div>
            )}
          </Show>
        </div>
      </div>

      {/* <div class="flex flex-col w-full md:w-[500px] p-4 md:overflow-auto border-b md:border-b-0 h-content"></div> */}
    </div>
  );
}
