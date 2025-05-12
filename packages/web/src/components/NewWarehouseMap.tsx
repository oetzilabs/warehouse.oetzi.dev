import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { clientOnly } from "@solidjs/start";
import { WarehouseInfo } from "@warehouseoetzidev/core/src/entities/warehouses";
import dayjs from "dayjs";
import Fullscreen from "lucide-solid/icons/fullscreen";
import Minus from "lucide-solid/icons/minus";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Settings from "lucide-solid/icons/settings";
import { Accessor, createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";

const TFE = clientOnly(() => import("./ToggleFullscreenOnElement"));

export const NewWarehouseMap = (props: { warehouse: Accessor<WarehouseInfo> }) => {
  const [zoomLevel, setZoomLevel] = createSignal(1);

  const overallBoundingBox = createMemo(() => {
    const warehouse = props.warehouse();
    const areas = warehouse.areas;
    if (areas.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const area of areas) {
      minX = Math.min(minX, area.bounding_box.x);
      minY = Math.min(minY, area.bounding_box.y);
      maxX = Math.max(maxX, area.bounding_box.x + area.bounding_box.width);
      maxY = Math.max(maxY, area.bounding_box.y + area.bounding_box.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  });

  let parentRef: HTMLDivElement | undefined;

  const zoomLevelChange = (bbox: ReturnType<typeof overallBoundingBox>) => {
    // Check if the parentRef is available and if the bounding box has dimensions
    if (parentRef && (bbox.width > 0 || bbox.height > 0)) {
      const parentWidth = parentRef.clientWidth;
      const parentHeight = parentRef.clientHeight;

      const pad = 150;

      // Calculate the zoom level needed to fit the content within the parent
      // Consider both width and height to ensure everything is visible
      // Also consider padding to ensure there's some space around the content
      const scaleX = parentWidth / (bbox.width + pad);
      const scaleY = parentHeight / (bbox.height + pad);

      // Use the minimum scale to ensure all content fits
      const newZoomLevel = Math.min(scaleX, scaleY);

      // Set the new zoom level, ensuring it's a reasonable value (e.g., not exceeding a max zoom)
      // You might want to add a max zoom limit here if needed.
      setZoomLevel(newZoomLevel > 0 ? newZoomLevel : 1); // Ensure zoomLevel is at least 1 if bbox is tiny
    } else {
      // If there's no content or parent ref, reset zoom to 1 or another default
      setZoomLevel(1);
    }
  };

  createEffect(() => {
    const bbox = overallBoundingBox();

    zoomLevelChange(bbox);
  });

  const lastUpdated = createMemo(() => {
    const warehouse = props.warehouse();
    return dayjs(warehouse.updatedAt ?? warehouse.createdAt).fromNow();
  });

  let warehousemapRef: HTMLDivElement | undefined;

  const [selectedArea, setSelectedArea] = createSignal<string | undefined>(undefined);

  const isAreaSelected = (id: string) => selectedArea() === id;

  createEffect(() => {
    const closeAreaSelectedKeyhandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedArea(undefined);
      }
    };
    document.addEventListener("keydown", closeAreaSelectedKeyhandler);
    onCleanup(() => {
      document.removeEventListener("keydown", closeAreaSelectedKeyhandler);
    });
  });

  onMount(() => {
    const windowRezieHandler = () => {
      const bbox = overallBoundingBox();
      zoomLevelChange(bbox);
    };
    window.addEventListener("resize", windowRezieHandler);
    onCleanup(() => {
      window.removeEventListener("resize", windowRezieHandler);
    });
  });

  return (
    <div class="rounded-md w-full aspect-video bg-background border relative overflow-clip" ref={warehousemapRef!}>
      <div class="flex items-center justify-center w-full h-full relative bg-muted/50">
        <Show when={overallBoundingBox()}>
          {(bb) => (
            <div
              class="relative"
              style={{
                width: `${bb().width}px`,
                height: `${bb().height}px`,
                transform: `scale(${zoomLevel()})`, // Apply the scale transformation
                "transform-origin": "center center", // Set the origin for the transformation
              }}
              ref={parentRef!}
            >
              <For each={props.warehouse().areas}>
                {(area) => (
                  <div
                    class="absolute border bg-background rounded drop-shadow-sm "
                    style={{
                      top: `${area.bounding_box.y - bb().y}px`,
                      left: `${area.bounding_box.x - bb().x}px`,
                      width: `${area.bounding_box.width}px`,
                      height: `${area.bounding_box.height}px`,
                    }}
                  >
                    <div class="flex flex-col gap-2 items-center w-full h-full static ">
                      <div
                        class={cn("flex gap-2 items-center w-full h-full p-2 cursor-pointer", {
                          "flex-col": area.bounding_box.width > area.bounding_box.height,
                          "flex-row": area.bounding_box.width < area.bounding_box.height,
                        })}
                        onClick={() => {
                          if (isAreaSelected(area.id)) {
                            setSelectedArea(undefined);
                            return;
                          }
                          setSelectedArea(area.id);
                        }}
                      >
                        <For each={area.storages}>
                          {(storage) => (
                            <div class=" border bg-background rounded drop-shadow-sm border-b last:border-b-0"></div>
                          )}
                        </For>
                      </div>
                      <div class="absolute top-0 -right-10 w-content h-content z-10">
                        <div class="flex flex-col gap-2 items-center">
                          <Button size="icon" class="size-8 border bg-background" variant="outline">
                            <Plus class="size-4" />
                          </Button>
                          <Show when={area.storages.length > 0}>
                            <Button size="icon" class="size-8 border bg-background" variant="outline">
                              <Settings class="size-4" />
                            </Button>
                          </Show>
                        </div>
                      </div>
                      <div class="absolute -bottom-6 left-0 w-content h-content">
                        <span class="text-xs text-muted-foreground/50 select-none">{area.name}</span>
                      </div>
                    </div>
                    <div
                      class={cn(
                        "absolute top-0 -left-2 -translate-x-[100%] h-content z-20 bg-background border rounded-sm drop-shadow-sm flex flex-col gap-2 items-center justify-end",
                        {
                          hidden: !isAreaSelected(area.id),
                          flex: isAreaSelected(area.id),
                        },
                      )}
                    >
                      <div class="min-w-40 flex flex-col p-2"></div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          )}
        </Show>
      </div>
      <div class="absolute left-0 bottom-0 p-3">
        <div class="flex flex-row items-center justify-end shadow-sm rounded-md bg-background p-2 border">
          <Show when={lastUpdated()}>
            {(lu) => <span class="text-xs leading-none text-muted-foreground">Last Updated: {lu()}</span>}
          </Show>
        </div>
      </div>
      <div class="absolute right-0 bottom-0 p-3 flex flex-row gap-2">
        <div class="flex flex-row items-center justify-end shadow-sm rounded-md">
          <TFE
            element={warehousemapRef!}
            onFullscreenOn={() => {
              setZoomLevel(1);
            }}
            onFullscreenOff={() => {
              const bbox = overallBoundingBox();

              zoomLevelChange(bbox);
            }}
          />
        </div>
        <div class="flex flex-row items-center justify-end shadow-sm rounded-md">
          <Button
            size="icon"
            class="size-8 rounded-r-none border border-r-0 bg-background"
            variant="secondary"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2))}
          >
            <Plus class="size-4" />
          </Button>
          <Button
            size="icon"
            class="size-8 rounded-none border border-r-0 bg-background"
            variant="secondary"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.6))}
          >
            <Minus class="size-4" />
          </Button>
          <Button
            size="icon"
            class="size-8 rounded-l-none border bg-background"
            variant="secondary"
            onClick={() => {
              const bbox = overallBoundingBox();

              zoomLevelChange(bbox);
            }}
          >
            <RotateCw class="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
