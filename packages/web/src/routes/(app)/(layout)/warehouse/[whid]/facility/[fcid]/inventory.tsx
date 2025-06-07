import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getFacilityByWarehouseId } from "@/lib/api/facilities";
import { A, createAsync, RouteDefinition, useParams } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Plus from "lucide-solid/icons/plus";
import { createSignal, For, Show } from "solid-js";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    return { user, sessionToken };
  },
} as RouteDefinition;

export default function InventoryPage() {
  const params = useParams();
  const facility = createAsync(() => getFacilityByWarehouseId(params.whid, params.fcid));

  const cleanupProductsListNoDuplciates = (
    products: NonNullable<
      Awaited<ReturnType<typeof getFacilityByWarehouseId>>
    >["areas"][number]["storages"][number]["spaces"][number]["products"],
  ): Array<(typeof products)[number] & { count: number }> => {
    const result: Array<(typeof products)[number] & { count: number }> = [];
    for (const p of products) {
      if (!result.find((r) => r.id === p.id)) {
        result.push({ ...p, count: 1 });
      } else {
        result.find((r) => r.id === p.id)!.count++;
      }
    }
    return result;
  };

  return (
    <Show when={facility()}>
      {(fc) => (
        <div class="flex flex-col gap-4 container w-full grow py-4">
          <div class="flex flex-row items-center justify-between gap-4">
            <div class="flex flex-row items-center gap-4">
              <Button variant="outline" as={A} href={`/warehouse/${params.whid}`} size="sm" class="bg-background">
                <ArrowLeft class="size-4" />
                Back
              </Button>
              <h1 class="text-sm font-semibold leading-none">Facility {fc().name}</h1>
            </div>
            <div class="flex items-center gap-4">
              <Button size="sm">
                <Plus class="size-4" />
                Add Storage Space
              </Button>
            </div>
          </div>
          <For each={fc().areas}>
            {(area) => (
              <div class="flex flex-col gap-4">
                <For each={area.storages}>
                  {(storage) => (
                    <div class="flex flex-col gap-2">
                      <div class="flex flex-row items-center gap-2">
                        <span class="font-semibold uppercase">{storage.name}</span>
                        <Badge variant="outline">{storage.type.name}</Badge>
                      </div>
                      <div
                        class="flex flex-row border w-full"
                        style={{
                          height: `${storage.boundingBox[storage.variant === "vertical" ? "width" : "height"]}px`,
                        }}
                      >
                        <For each={storage.spaces}>
                          {(inv) => (
                            <div
                              class="flex gap-2 border-r last:border-r-0 h-full"
                              style={{
                                width: `calc(100% / ${storage.spaces.length})`,
                              }}
                            >
                              <div class="flex flex-col w-full">
                                <For each={cleanupProductsListNoDuplciates(inv.products)}>
                                  {(p) => (
                                    <div class="flex flex-row gap-2 w-full p-4 select-none hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b last:border-b-0">
                                      <span>{p.count}x</span>
                                      <span class="font-medium truncate">{p.name}</span>
                                    </div>
                                  )}
                                </For>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      )}
    </Show>
  );
}
