import { cn, getStorageStockStatus } from "@/lib/utils";
import { type OrganizationInventoryInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import { type StorageInfo } from "@warehouseoetzidev/core/src/entities/storages";
import { Accessor, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";

const calculateCombinedBoundingBox = (
  facility: OrganizationInventoryInfo["warehouses"][number]["warehouse"]["facilities"][number],
) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  facility.areas.forEach((area) => {
    minX = Math.min(minX, area.bounding_box.x);
    minY = Math.min(minY, area.bounding_box.y);
    maxX = Math.max(maxX, area.bounding_box.x + area.bounding_box.width);
    maxY = Math.max(maxY, area.bounding_box.y + area.bounding_box.height);
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

const FacilityImage = (props: {
  facility: Accessor<OrganizationInventoryInfo["warehouses"][number]["warehouse"]["facilities"][number]>;
}) => {
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

  const renderStorage = (
    storage: Omit<StorageInfo, "warehouseAreaId" | "labels" | "products" | "type" | "parent" | "area">,
  ) => {
    const status = getStorageStockStatus(storage);
    const statusColors = {
      low: "bg-rose-200 dark:bg-rose-600",
      "near-min": "bg-orange-200 dark:bg-orange-600",
      "below-reorder": "bg-yellow-200 dark:bg-yellow-600",
      optimal: "bg-emerald-200 dark:bg-emerald-600",
      "has-products": "bg-lime-200 dark:bg-lime-600",
      empty: "bg-muted-foreground/[0.05]",
    };

    return (
      <div
        class={cn(
          "absolute border border-neutral-400 dark:border-neutral-500 flex rounded-sm overflow-clip",
          {
            "flex-row": storage.variant === "vertical",
            "flex-col": storage.variant === "horizontal",
          },
          statusColors[status],
        )}
        style={{
          top: `${storage.bounding_box.y + padding}px`,
          left: `${storage.bounding_box.x + padding}px`,
          width: `${storage.bounding_box.width}px`,
          height: `${storage.bounding_box.depth ?? storage.bounding_box.height}px`,
        }}
      >
        <Show when={storage.children?.length > 0}>
          <For each={storage.children}>{renderStorage}</For>
        </Show>
      </div>
    );
  };

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
                  top: `${area.bounding_box.y}px`,
                  left: `${area.bounding_box.x}px`,
                  width: `${area.bounding_box.width + 2 * padding}px`,
                  height: `${area.bounding_box.height + 2 * padding}px`,
                }}
              >
                <div class="w-full h-full relative">
                  <For each={area.storages}>{renderStorage}</For>
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
