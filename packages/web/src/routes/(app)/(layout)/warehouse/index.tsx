import { WarehouseList } from "@/components/lists/warehouses";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getWarehouses } from "@/lib/api/warehouses";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser();
    const sessionToken = getSessionToken();
    const warehouses = getWarehouses();
    return { user, sessionToken, warehouses };
  },
} as RouteDefinition;

export default function WarehousePage() {
  const data = createAsync(() => getWarehouses(), { deferStream: true });

  return (
    <Show when={data()}>
      {(warehouseList) => (
        <div class="flex flex-col grow p-2 relative">
          <div class="w-full flex flex-row h-full">
            <div class="w-full flex flex-col gap-2">
              <div class="flex items-center gap-2 justify-between w-full bg-background pb-2">
                <h1 class="font-semibold leading-none">Warehouses</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate(getWarehouses.key), {
                        loading: "Refreshing warehouses...",
                        success: "Warehouses refreshed",
                        error: "Failed to refresh warehouses",
                      });
                    }}
                  >
                    <RotateCw class="size-4" />
                  </Button>
                  <Button as={A} href="/warehouse/new" size="sm" class="pl-2.5 rounded-l-none">
                    <Plus class="size-4" />
                    Add Warehouse
                  </Button>
                </div>
              </div>
              <WarehouseList data={warehouseList} />
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
