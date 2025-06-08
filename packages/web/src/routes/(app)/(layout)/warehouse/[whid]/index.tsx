import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getWarehouseById } from "@/lib/api/warehouses";
import { A, createAsync, RouteDefinition, useParams } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Plus from "lucide-solid/icons/plus";
import Warehouse from "lucide-solid/icons/warehouse";
import { For, Show } from "solid-js";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    return { user, sessionToken };
  },
} as RouteDefinition;

export default function WarehousePage() {
  const params = useParams();
  const warehouse = createAsync(() => getWarehouseById(params.whid));

  return (
    <Show when={warehouse()}>
      {(wh) => (
        <div class="flex flex-col gap-4 container w-full grow py-4">
          <div class="flex flex-row items-center justify-between gap-4">
            <div class="flex flex-row items-center gap-4">
              <Button variant="outline" as={A} href="/warehouse" size="sm" class="bg-background">
                <ArrowLeft class="size-4" />
                Back
              </Button>
              <h1 class="text-sm font-semibold leading-none">Warehouse {wh().name}</h1>
            </div>
            <div class="flex items-center gap-4">
              <Button size="sm">
                <Plus class="size-4" />
                Add Facility
              </Button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <For each={wh().facilities}>
              {(facility) => (
                <div class="flex flex-col border rounded-lg">
                  <div class="flex flex-row items-center gap-2 p-4 border-b bg-muted-foreground/5 dark:bg-muted/30 justify-between">
                    <div class="flex flex-row items-center gap-4">
                      <Warehouse class="size-4" />
                      <span class="font-semibold">{facility.name}</span>
                    </div>
                  </div>
                  <div class="p-4">
                    <div class="flex flex-col gap-2">
                      <div class="flex justify-between text-sm">
                        <span>Total Areas:</span>
                        <span>{facility.ars.length}</span>
                      </div>
                      <div class="flex justify-between text-sm">
                        <span>Total Storage Units:</span>
                        <span>{facility.ars.reduce((acc, area) => acc + area.strs.length, 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div class="p-4 border-t mt-auto">
                    <Button
                      as={A}
                      href={`/warehouse/${wh().id}/facility/${facility.id}/inventory`}
                      variant="outline"
                      class="w-full"
                    >
                      View Inventory
                    </Button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      )}
    </Show>
  );
}
