import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateAreaBoundingBox } from "@/lib/api/areas";
import { cn } from "@/lib/utils";
import { useAction, useSubmission } from "@solidjs/router";
import { type FacilityInfo } from "@warehouseoetzidev/core/src/entities/facilities";
import { type OrganizationInventoryInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import ChevronDown from "lucide-solid/icons/chevron-down";
import Loader2 from "lucide-solid/icons/loader-2";
import MinimizeIcon from "lucide-solid/icons/minimize";
import Move from "lucide-solid/icons/move";
import EditPenIcon from "lucide-solid/icons/pencil";
import Plus from "lucide-solid/icons/plus";
import RotateCcw from "lucide-solid/icons/rotate-ccw";
import SaveIcon from "lucide-solid/icons/save";
import Trash2 from "lucide-solid/icons/trash-2";
import X from "lucide-solid/icons/x";
import { Accessor, createEffect, createSignal, For, mergeProps, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";
import { toast } from "solid-sonner";

// Remove or modify areaBoundingBox as we'll use the actual bounding box
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
  const padding = 20; // Extra padding around the view
  const viewportWidth = w - padding;
  const viewportHeight = h - padding;

  const scaleX = w / boundingBox.width;
  const scaleY = h / boundingBox.height;
  console.log(scaleX, scaleY);
  // Use the smaller scale to ensure everything fits
  return Math.min(scaleX, scaleY, 1); // Cap at 1 to prevent too much zoom
};

const Ruler = (props: { orientation: "horizontal" | "vertical"; length: number; offset: number; padding: number }) => {
  const majorTick = 100; // 100cm = 1m
  const minorTick = 10; // 10cm

  return (
    <div
      class={cn("absolute flex items-center text-xs text-muted-foreground", {
        "left-0 h-6": props.orientation === "horizontal",
        "top-0 w-6 flex-col": props.orientation === "vertical",
      })}
      style={{
        [props.orientation === "horizontal" ? "width" : "height"]: `${props.length}px`,
        [props.orientation === "horizontal" ? "top" : "left"]: `${props.offset}px`,
      }}
    >
      <For each={Array.from({ length: Math.floor(props.length / minorTick) + (2 * props.padding) / minorTick })}>
        {(_, i) => (
          <div
            class={cn("absolute bg-neutral-300 dark:bg-neutral-700", {
              "h-2 w-px": props.orientation === "horizontal",
              "w-2 h-px": props.orientation === "vertical",
            })}
            style={{
              [props.orientation === "horizontal" ? "left" : "top"]: `${i() * minorTick}px`,
            }}
          >
            <Show when={i() % 10 === 0}>
              <span
                class={cn("absolute", {
                  "bottom-2 -translate-x-1/2": props.orientation === "horizontal",
                  "-left-6 -translate-y-1/2": props.orientation === "vertical",
                })}
              >
                {i() * minorTick}
              </span>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
};

interface EditorState {
  ready: boolean;
  position: { x: number; y: number };
  zoom: number;
  resizingArea: string | null;
}

const FacilityEditor = (props: { facility: Accessor<OrganizationInventoryInfo["warehouses"][0]["facilities"][0]> }) => {
  const padding = 20;
  const initialCenter = calculateCombinedBoundingBox(props.facility());
  let mapRef: HTMLDivElement | undefined;
  const [editing, setEditing] = createSignal(false);

  onMount(() => {
    if (isServer) return;
    if (!mapRef) return;
    const zoom = calculateInitialZoom(mapRef.clientWidth, mapRef.clientHeight, initialCenter);
    setState("zoom", zoom);
    setState("ready", true);
  });

  const [state, setState] = createStore<EditorState>({
    ready: false,
    position: { x: -initialCenter.centerX, y: -initialCenter.centerY },
    zoom: 1,
    resizingArea: null,
  });

  const updateAreaBoundingBoxAction = useAction(updateAreaBoundingBox);
  const isUpdatingAreaBoundingBox = useSubmission(updateAreaBoundingBox);

  const resetView = () => {
    if (!mapRef) return;
    const zoom = calculateInitialZoom(mapRef.clientWidth, mapRef.clientHeight, initialCenter);
    setState({
      position: { x: -initialCenter.centerX, y: -initialCenter.centerY },
      zoom,
    });
    toast.info("View has been reset");
  };

  const tightenArea = (area: OrganizationInventoryInfo["warehouses"][0]["facilities"][0]["areas"][number]) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    area.storages.forEach((storage) => {
      minX = Math.min(minX, storage.boundingBox.x);
      minY = Math.min(minY, storage.boundingBox.y);
      maxX = Math.max(maxX, storage.boundingBox.x + storage.boundingBox.width);
      maxY = Math.max(maxY, storage.boundingBox.y + (storage.boundingBox.length ?? storage.boundingBox.height));
    });
    const bb = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    toast.promise(updateAreaBoundingBoxAction(props.facility().id, area.id, bb), {
      loading: "Updating area bounding box...",
      success: "Area bounding box updated",
      error: "Failed to update area bounding box",
    });
  };

  return (
    <div class="flex flex-col w-full grow relative bg-muted-foreground/[0.02]" ref={mapRef!}>
      <div class="absolute top-0 z-50 bg-background border-b flex flex-row items-center gap-2 justify-end select-none w-full h-max">
        <div class="flex flex-row items-center gap-2 p-2">
          <Show when={editing()}>
            <Button
              class="px-3 h-8 bg-background"
              variant="outline"
              onClick={() => {
                setEditing(false);
              }}
            >
              <span>Cancel</span>
              <X class="size-4" />
            </Button>
          </Show>
          <Button
            class="px-3 h-8"
            onClick={() => {
              const ed = editing();
              if (ed) {
                // TODO: Save facility
                toast.promise(
                  new Promise<void>((resolve, reject) => {
                    setTimeout(() => {
                      resolve();
                    }, 1000);
                  }),
                  {
                    loading: "Saving facility...",
                    success: "Facility saved",
                    error: "Failed to save facility",
                  },
                );
                setEditing(false);
              } else {
                setEditing(true);
              }
            }}
          >
            <Show
              when={editing()}
              fallback={
                <>
                  <span>Edit</span>
                  <EditPenIcon class="size-4" />
                </>
              }
            >
              <span>Save</span>
              <SaveIcon class="size-4" />
            </Show>
          </Button>
          <Button variant="outline" class="px-3 h-8   bg-background" onClick={resetView}>
            Reset View
            <RotateCcw class="size-4" />
          </Button>
        </div>
      </div>
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
            transform: `translate(-50%, -50%) translate(${state.position.x}px, ${state.position.y}px) scale(${state.zoom})`,
            "transform-origin": "center",
          }}
        >
          <div class="relative">
            <For
              each={props.facility().areas}
              fallback={
                <div class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] flex flex-col items-center justify-center gap-4">
                  <span class="text-sm text-muted-foreground w-max">No areas added</span>
                </div>
              }
            >
              {(area) => (
                <div
                  class="outline-1 outline-neutral-400 dark:outline-neutral-700 outline-dashed group absolute rounded-sm"
                  style={{
                    top: `${area.boundingBox.y}px`,
                    left: `${area.boundingBox.x}px`,
                    width: `${area.boundingBox.width + 2 * padding}px`,
                    height: `${area.boundingBox.height + 2 * padding}px`,
                  }}
                >
                  <Show when={editing()}>
                    <div class="absolute -bottom-10 right-0 flex gap-2 items-center z-50">
                      <DropdownMenu>
                        <DropdownMenuTrigger as={Button} size="sm" variant="outline" class="bg-background">
                          Area <ChevronDown class="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => tightenArea(area)}>
                            <MinimizeIcon class="size-4 mr-2" />
                            Tighten Area
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled onSelect={() => setState("resizingArea", area.id)}>
                            <Move class="size-4 mr-2" />
                            Resize Area
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Show>
                  <Show when={editing()}>
                    <div class="absolute -top-6 left-0 flex gap-2 items-center">
                      <span class="text-xs text-muted-foreground">{area.name}</span>
                      <span class="text-xs text-muted-foreground">
                        ({area.boundingBox.width}cm × {area.boundingBox.height}cm)
                      </span>
                    </div>
                  </Show>
                  <Show when={editing()}>
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Ruler orientation="horizontal" length={area.boundingBox.width} offset={-45} padding={padding} />
                      <Ruler orientation="vertical" length={area.boundingBox.height} offset={-25} padding={padding} />
                    </div>
                  </Show>
                  <div class="w-full h-full relative">
                    <For each={area.storages}>
                      {(storage) => (
                        <div
                          class={cn(
                            "absolute border border-neutral-400 dark:border-neutral-500 bg-muted group/storage flex rounded-sm",
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
                          <Show when={editing()}>
                            <div class="absolute -top-6 left-0 z-20">
                              <span class="text-xs text-muted-foreground">{storage.name}</span>
                            </div>
                            <div class="absolute -right-8 top-0 flex flex-col gap-1 z-50">
                              <Button size="icon" class="!size-6 bg-background" variant="outline">
                                <Plus class="!size-3" />
                              </Button>
                              <Button size="icon" class="!size-6" variant="destructive">
                                <Trash2 class="!size-3 text-white" />
                              </Button>
                            </div>
                          </Show>

                          <For each={storage.spaces}>
                            {(space) => (
                              <div
                                class={cn("group/inv relative border-neutral-400 dark:border-neutral-500", {
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
                              >
                                <Show when={editing()}>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    class="absolute -top-2 -right-2 size-6 opacity-0 group-hover/inv:opacity-100 z-50"
                                  >
                                    <Trash2 class="size-2 text-white" />
                                  </Button>
                                </Show>
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
      </Show>
    </div>
  );
};

export default FacilityEditor;
