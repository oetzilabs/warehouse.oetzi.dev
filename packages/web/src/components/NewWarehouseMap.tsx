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
import { Accessor, createEffect, createMemo, createSignal, For, onCleanup, Show } from "solid-js";

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

  return (
    <div class="rounded-md w-full aspect-video bg-muted/50 border relative overflow-clip" ref={warehousemapRef!}>
      <div class="flex items-center justify-center w-full h-full relative">
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
            >
              <For each={props.warehouse().areas}>
                {(area) => (
                  <div
                    class="absolute border bg-background rounded drop-shadow-sm group cursor-pointer"
                    style={{
                      top: `${area.bounding_box.y - bb().y}px`,
                      left: `${area.bounding_box.x - bb().x}px`,
                      width: `${area.bounding_box.width}px`,
                      height: `${area.bounding_box.height}px`,
                    }}
                    onClick={() => {
                      if (isAreaSelected(area.id)) {
                        setSelectedArea(undefined);
                        return;
                      }
                      setSelectedArea(area.id);
                    }}
                  >
                    <div class="flex flex-col gap-2 items-center w-full h-full relative p-2">
                      <For each={area.storages}>
                        {(storage) => (
                          <div class=" border bg-background rounded drop-shadow-sm border-b last:border-b-0"></div>
                        )}
                      </For>
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
                        <span class="text-xs text-muted-foreground/50">{area.name}</span>
                      </div>
                    </div>
                    <div
                      class={cn(
                        "absolute top-0 w-content -left-6 h-content z-20 p-2 bg-background border rounded-sm drop-shadow-sm",
                        {
                          "hidden group-hover:flex": !isAreaSelected(area.id),
                          flex: isAreaSelected(area.id),
                        },
                      )}
                    >
                      {/*Here will be information about the area, meaning the storages and inventory spaces*/}
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
          <TFE element={warehousemapRef!} />
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
            onClick={() => setZoomLevel(1)}
          >
            <RotateCw class="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
