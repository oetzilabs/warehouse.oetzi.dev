import { cn } from "@/lib/utils";
import { A } from "@solidjs/router";
import { InventoryInfo } from "@warehouseoetzidev/core/src/entities/inventory";
import Loader2 from "lucide-solid/icons/loader-2";
import { Accessor, For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";

const calculateCombinedBoundingBox = (storage: InventoryInfo["storages"][number]) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Calculate bounds based on storage positions
  minX = Math.min(minX, storage.bounding_box.x);
  minY = Math.min(minY, storage.bounding_box.y);
  maxX = Math.max(maxX, storage.bounding_box.x + storage.bounding_box.width);
  maxY = Math.max(maxY, storage.bounding_box.y + storage.bounding_box.height);

  const width = maxX - minX === -Infinity ? 0 : maxX - minX;
  const height = maxY - minY === -Infinity ? 0 : maxY - minY;
  const centerX = minX === Infinity ? 0 : minX + width / 2;
  const centerY = minY === Infinity ? 0 : minY + height / 2;

  return { centerX, centerY, width, height };
};

const statusColors = {
  low: "bg-rose-200 dark:bg-rose-600",
  "near-min": "bg-orange-200 dark:bg-orange-600",
  "below-reorder": "bg-yellow-200 dark:bg-yellow-600",
  optimal: "bg-emerald-200 dark:bg-emerald-600",
  "has-products": "bg-lime-200 dark:bg-lime-600",
  empty: "bg-muted-foreground/[0.05]",
};

const calculateInitialZoom = (w: number, h: number, bounding_box: ReturnType<typeof calculateCombinedBoundingBox>) => {
  const padding = 20;
  const viewportWidth = w - padding;
  const viewportHeight = h - padding;

  const scaleX = viewportWidth / bounding_box.width;
  const scaleY = viewportHeight / bounding_box.height;
  return Math.min(scaleX, scaleY, 1);
};

type StorageMapProps = {
  inventory: Accessor<InventoryInfo>;
};

export const StorageMap = (props: StorageMapProps) => {
  const padding = 20;
  let mapRef: HTMLDivElement | undefined;

  // Remove parentStorage, use all storages
  const initialCenter = calculateCombinedBoundingBox(props.inventory().storages[0]);

  const [state, setState] = createStore({
    ready: false,
    position: { x: -initialCenter.centerX, y: -initialCenter.centerY },
  });

  onMount(() => {
    if (isServer) return;
    if (!mapRef) return;
    setState("ready", true);
  });

  return (
    <div class="w-full h-min flex border rounded-lg overflow-clip bg-muted-foreground/5 dark:bg-muted/30">
      <div class="relative w-full min-h-[400px] max-h-[calc(100vh*0.6)]" ref={mapRef!}>
        <Show
          when={state.ready}
          fallback={
            <div class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex flex-col items-center justify-center gap-4">
              <Loader2 class="size-4 text-muted-foreground animate-spin" />
              <span class="text-xs text-muted-foreground">Loading map...</span>
            </div>
          }
        >
          <div
            class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
            style={{
              transform: `translate(-50%, -50%) translate(${state.position.x}px, ${state.position.y}px)`,
              "transform-origin": "center",
            }}
          >
            <div class="relative">
              <For each={props.inventory().storages}>
                {(storage) => (
                  <A
                    href={`/storages/${storage.id}`}
                    class={cn(
                      "absolute border border-neutral-400 dark:border-neutral-500 bg-muted flex rounded-sm overflow-clip",
                      {
                        "flex-row": storage.variant === "vertical",
                        "flex-col": storage.variant === "horizontal",
                      },
                    )}
                    style={{
                      width: `${storage.bounding_box.width}px`,
                      height: `${storage.bounding_box.height}px`,
                      top: `${storage.bounding_box.y}px`,
                      left: `${storage.bounding_box.x}px`,
                    }}
                  >
                    <div class="absolute -top-6 left-0">
                      <span class="text-xs text-muted-foreground">{storage.name}</span>
                    </div>
                    <For each={storage.children ?? []}>
                      {(child) => (
                        <div
                          class={cn("border-neutral-300 dark:border-neutral-700", {
                            "border-r last:border-r-0": storage.variant === "vertical",
                            "border-b last:border-b-0": storage.variant === "horizontal",
                            "bg-transparent": storage.status === "empty",
                            "bg-rose-200 dark:bg-rose-600 border-rose-300 dark:border-rose-700":
                              storage.status === "low",
                            "bg-orange-200 dark:bg-orange-600 border-orange-300 dark:border-orange-700":
                              storage.status === "below-capacity",
                            "bg-yellow-200 dark:bg-yellow-600 border-yellow-300 dark:border-yellow-700":
                              storage.status === "below-reorder",
                            "bg-emerald-200 dark:bg-emerald-600 border-emerald-300 dark:border-emerald-700":
                              storage.status === "optimal",
                          })}
                          style={{
                            width: `${child.bounding_box.width - 2}px`,
                            height: `${child.bounding_box.height - 2}px`,
                          }}
                        ></div>
                      )}
                    </For>
                  </A>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
