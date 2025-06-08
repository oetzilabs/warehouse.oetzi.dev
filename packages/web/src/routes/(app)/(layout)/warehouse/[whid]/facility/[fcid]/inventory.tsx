import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getFacilityByWarehouseId } from "@/lib/api/facilities";
import { A, createAsync, RouteDefinition, useParams } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Container from "lucide-solid/icons/container";
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

  const cleanupProductsListNoDuplicates = (
    products: NonNullable<
      Awaited<ReturnType<typeof getFacilityByWarehouseId>>
    >["areas"][number]["storages"][number]["sections"][number]["spaces"][number]["products"],
  ): Array<(typeof products)[number] & { count: number }> => {
    const result: Array<(typeof products)[number] & { count: number }> = [];
    for (const p of products) {
      const existing = result.find((r) => r.id === p.id);
      if (!existing) {
        result.push({ ...p, count: 1 });
      } else {
        existing.count++;
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
                    <div class="flex flex-col border rounded-lg">
                      <div class="flex flex-row items-center gap-2 p-4 border-b bg-muted-foreground/5 dark:bg-muted/30 justify-between">
                        <div class="flex flex-row items-center gap-4">
                          <Container class="size-4" />
                          <span class="font-semibold uppercase">{storage.name}</span>
                        </div>
                        <Badge variant="outline">{storage.type.name}</Badge>
                      </div>
                      <div class="w-full h-content p-4">
                        <div
                          class="flex flex-row border w-full"
                          style={{
                            height: `${storage.boundingBox[storage.variant === "vertical" ? "width" : "height"]}px`,
                          }}
                        >
                          <For each={storage.sections}>
                            {(section) => (
                              <div
                                class="flex gap-2 border-r last:border-r-0 h-full"
                                style={{
                                  width: `calc(100% / ${storage.sections.length})`,
                                }}
                              >
                                <div class="flex flex-col w-full">
                                  <For each={section.spaces}>
                                    {(space) => (
                                      <div
                                        class="flex flex-col w-full select-none hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b last:border-b-0"
                                        style={{
                                          height: space.dimensions ? `${space.dimensions.height}px` : "100%",
                                        }}
                                      >
                                        <For each={cleanupProductsListNoDuplicates(space.products)}>
                                          {(p) => (
                                            <div class="flex flex-row gap-2 w-full p-4 select-none hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                              <span>{p.count}x</span>
                                              <span class="font-medium truncate">{p.name}</span>
                                            </div>
                                          )}
                                        </For>
                                      </div>
                                    )}
                                  </For>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
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
