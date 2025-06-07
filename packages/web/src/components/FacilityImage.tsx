import { cn } from "@/lib/utils";
import { type OrganizationInventoryInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import { Accessor, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";

const calculateCombinedBoundingBox = (facility: OrganizationInventoryInfo["warehouses"][0]["facilities"][0]) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  facility.areas.forEach((area) => {
    minX = Math.min(minX, area.boundingBox.x);
    minY = Math.min(minY, area.boundingBox.y);
    maxX = Math.max(maxX, area.boundingBox.x + area.boundingBox.width);
    maxY = Math.max(maxY, area.boundingBox.y + area.boundingBox.height);
  });

  const width = maxX - minX === -Infinity ? 0 : maxX - minX;
  const height = maxY - minY === -Infinity ? 0 : maxY - minY;
  const centerX = minX === Infinity ? 0 : minX + width / 2;
  const centerY = minY === Infinity ? 0 : minY + height / 2;

  return { centerX, centerY, width, height };
};

const calculateInitialZoom = (w: number, h: number, boundingBox: ReturnType<typeof calculateCombinedBoundingBox>) => {
  const padding = 40; // Increased padding for better visibility
  const viewportWidth = w - padding;
  const viewportHeight = h - padding;

  const scaleX = viewportWidth / (boundingBox.width + padding);
  const scaleY = viewportHeight / (boundingBox.height + padding);
  return Math.min(scaleX, scaleY) * 0.9; // Apply 0.9 factor for some margin
};

const FacilityImage = (props: { facility: Accessor<OrganizationInventoryInfo["warehouses"][0]["facilities"][0]> }) => {
  const padding = 10;
  const initialCenter = calculateCombinedBoundingBox(props.facility());
  let containerRef: HTMLDivElement | undefined;

  const [state, setState] = createStore({
    ready: false,
    position: { x: -initialCenter.centerX, y: -initialCenter.centerY },
    zoom: 1,
  });

  onMount(() => {
    if (isServer || !containerRef) return;

    const updateZoom = () => {
      const zoom = calculateInitialZoom(containerRef!.clientWidth, containerRef!.clientHeight, initialCenter);
      setState({ zoom, ready: true });
    };

    // Initial zoom calculation
    updateZoom();

    // Create resize observer
    const resizeObserver = new ResizeObserver(() => {
      updateZoom();
    });

    resizeObserver.observe(containerRef);

    // Cleanup
    onCleanup(() => {
      resizeObserver.disconnect();
    });
  });

  return (
    <div class="flex flex-col w-full h-full relative items-center justify-center select-none" ref={containerRef!}>
      <Show when={state.ready} fallback={<div class="w-full h-full bg-muted-foreground/5 animate-pulse rounded-lg" />}>
        <div
          class="absolute w-content min-w-0 h-content min-h-0"
          style={{
            transform: `scale(${state.zoom}) translate(${state.position.x}px, ${state.position.y}px)`,
            "transform-origin": "center",
          }}
        >
          <For each={props.facility().areas}>
            {(area) => (
              <div
                class="outline-1 outline-neutral-400 dark:outline-neutral-700 outline-dashed absolute rounded-sm"
                style={{
                  top: `${area.boundingBox.y}px`,
                  left: `${area.boundingBox.x}px`,
                  width: `${area.boundingBox.width + 2 * padding}px`,
                  height: `${area.boundingBox.height + 2 * padding}px`,
                }}
              >
                <div class="w-full h-full relative">
                  <For each={area.storages}>
                    {(storage) => (
                      <div
                        class={cn(
                          "absolute border border-neutral-400 dark:border-neutral-500 flex rounded-sm overflow-clip",
                          {
                            "flex-row": storage.variant === "vertical",
                            "flex-col": storage.variant === "horizontal",
                          },
                        )}
                        style={{
                          top: `${storage.boundingBox.y + padding}px`,
                          left: `${storage.boundingBox.x + padding}px`,
                          width: `${storage.boundingBox.width}px`,
                          height: `${storage.boundingBox.length ?? storage.boundingBox.height}px`,
                        }}
                      >
                        <For each={storage.spaces}>
                          {(space) => (
                            <div
                              class={cn("relative border-neutral-400 dark:border-neutral-500", {
                                "border-r last:border-r-0": storage.variant === "vertical",
                                "border-b last:border-b-0": storage.variant === "horizontal",
                                // Red for spaces with products below minimum stock
                                "bg-rose-200 dark:bg-rose-600": space.products.some((p) => p.stock < p.minStock),
                                // Orange for spaces with products near minimum stock
                                "bg-orange-200 dark:bg-orange-600":
                                  !space.products.some((p) => p.stock < p.minStock) &&
                                  space.products.some((p) => p.stock < p.minStock * 1.5),
                                // Yellow for spaces with products below reorder point
                                "bg-yellow-200 dark:bg-yellow-600":
                                  !space.products.some((p) => p.stock < p.minStock * 1.5) &&
                                  space.products.some((p) => p.stock < (p.reorderPoint ?? 0)),
                                // Lime for spaces with products above reorder point but below max
                                "bg-lime-200 dark:bg-lime-600":
                                  space.products.length > 0 &&
                                  space.products.every((p) => p.stock >= (p.reorderPoint ?? 0)) &&
                                  space.products.some((p) => p.stock < (p.maxStock ?? Infinity)),
                                // Emerald for spaces with optimal stock levels
                                "bg-emerald-200 dark:bg-emerald-600":
                                  space.products.length > 0 &&
                                  space.products.every((p) => p.stock >= (p.reorderPoint ?? 0)),
                                // Default color for empty spaces
                                "bg-muted-foreground/[0.05] text-muted-foreground": space.products.length === 0,
                              })}
                              style={
                                storage.variant === "horizontal"
                                  ? {
                                      width: "100%",
                                      height: `calc(100%/${storage.spaces.length})`,
                                    }
                                  : {
                                      width: `${storage.boundingBox.width / storage.spaces.length}px`,
                                      height: "100%",
                                    }
                              }
                            />
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
      </Show>
    </div>
  );
};

export default FacilityImage;
