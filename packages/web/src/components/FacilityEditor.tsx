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
import ChevronDown from "lucide-solid/icons/chevron-down";
import Loader2 from "lucide-solid/icons/loader-2";
import MinimizeIcon from "lucide-solid/icons/minimize";
import Move from "lucide-solid/icons/move";
import Plus from "lucide-solid/icons/plus";
import RotateCcw from "lucide-solid/icons/rotate-ccw";
import Trash2 from "lucide-solid/icons/trash-2";
import { Accessor, createEffect, createSignal, For, mergeProps, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";
import { toast } from "solid-sonner";

// Remove or modify areaBoundingBox as we'll use the actual bounding box
const calculateCombinedBoundingBox = (facility: FacilityInfo) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  facility.ars.forEach((area) => {
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
  isSpacePressed: boolean;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  position: { x: number; y: number };
  zoom: number;
  resizingArea: string | null;
}

const FacilityEditor = (props: { facility: Accessor<FacilityInfo>; editing: Accessor<boolean> }) => {
  const padding = 20;
  const initialCenter = calculateCombinedBoundingBox(props.facility());
  let mapRef: HTMLDivElement | undefined;

  onMount(() => {
    if (isServer) return;
    if (!mapRef) return;
    const zoom = calculateInitialZoom(mapRef.clientWidth, mapRef.clientHeight, initialCenter);
    setState("zoom", zoom);
    setState("ready", true);
  });

  const [state, setState] = createStore<EditorState>({
    ready: false,
    isSpacePressed: false,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
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

  const tightenArea = (area: FacilityInfo["ars"][number]) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    area.strs.forEach((storage) => {
      minX = Math.min(minX, storage.bounding_box.x);
      minY = Math.min(minY, storage.bounding_box.y);
      maxX = Math.max(maxX, storage.bounding_box.x + storage.bounding_box.width);
      maxY = Math.max(maxY, storage.bounding_box.y + (storage.bounding_box.length ?? storage.bounding_box.height));
    });
    const bb = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    toast.promise(updateAreaBoundingBoxAction(props.facility().id, area.id, bb), {
      loading: "Updating area bounding box...",
      success: "Area bounding box updated",
      error: "Failed to update area bounding box",
    });
  };

  createEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setState("isSpacePressed", true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setState({
          isSpacePressed: false,
          isDragging: false,
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (state.isSpacePressed) {
        setState({
          isDragging: true,
          dragStart: {
            x: e.clientX - state.position.x,
            y: e.clientY - state.position.y,
          },
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (state.isDragging) {
        setState("position", {
          x: e.clientX - state.dragStart.x,
          y: e.clientY - state.dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setState("isDragging", false);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey) {
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        setState("zoom", (prev) => Math.max(0.1, Math.min(10, prev + delta)));
      } else if (e.shiftKey) {
        setState("position", (prev) => ({
          x: prev.x - e.deltaY,
          y: prev.y,
        }));
      } else {
        setState("position", (prev) => ({
          x: prev.x,
          y: prev.y - e.deltaY,
        }));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("wheel", handleWheel);
    };
  });

  return (
    <div class="w-full h-full relative" ref={mapRef!}>
      <Button variant="outline" class="absolute top-4 right-4 px-3 z-50 h-8 bg-background" onClick={resetView}>
        Reset View
        <RotateCcw class="size-4" />
      </Button>
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
            cursor: state.isSpacePressed ? (state.isDragging ? "grabbing" : "grab") : "default",
            transform: `translate(-50%, -50%) translate(${state.position.x}px, ${state.position.y}px) scale(${state.zoom})`,
            "transform-origin": "center",
          }}
        >
          <div class="relative">
            <For each={props.facility().ars}>
              {(area) => (
                <div
                  class="outline-1 outline-neutral-400 dark:outline-neutral-700 outline-dashed group absolute"
                  style={{
                    top: `${area.bounding_box.y}px`,
                    left: `${area.bounding_box.x}px`,
                    width: `${area.bounding_box.width + 2 * padding}px`,
                    height: `${area.bounding_box.height + 2 * padding}px`,
                  }}
                >
                  <Show when={props.editing()}>
                    <div class="absolute -top-14 right-0 flex gap-2 items-center z-50">
                      <DropdownMenu>
                        <DropdownMenuTrigger as={Button} size="sm" class="h-8">
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
                  <Show when={props.editing()}>
                    <div class="absolute -top-6 left-0 flex gap-2 items-center">
                      <span class="text-xs text-muted-foreground">{area.name}</span>
                      <span class="text-xs text-muted-foreground">
                        ({area.bounding_box.width}cm × {area.bounding_box.height}cm)
                      </span>
                    </div>
                  </Show>
                  <Show when={props.editing()}>
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Ruler orientation="horizontal" length={area.bounding_box.width} offset={-20} padding={padding} />
                      <Ruler orientation="vertical" length={area.bounding_box.height} offset={-20} padding={padding} />
                    </div>
                  </Show>
                  <div class="w-full h-full relative">
                    <For each={area.strs}>
                      {(storage) => (
                        <div
                          class={cn(
                            "absolute border border-neutral-400 dark:border-neutral-500 bg-muted group/storage flex",
                            {
                              "flex-row": storage.variant === "vertical",
                              "flex-col": storage.variant === "horizontal",
                            },
                          )}
                          style={{
                            top: `${storage.bounding_box.y + padding}px`,
                            left: `${storage.bounding_box.x + padding}px`,
                            width: `${storage.bounding_box.width}px`,
                            height: `${storage.bounding_box.length ?? storage.bounding_box.height}px`,
                          }}
                        >
                          <Show when={props.editing()}>
                            <div class="absolute -top-6 left-0">
                              <span class="text-xs text-muted-foreground">{storage.name}</span>
                            </div>
                            <div class="absolute -right-8 top-0 flex flex-col gap-1">
                              <Button size="icon" class="size-6">
                                <Plus class="size-3" />
                              </Button>
                              <Button size="icon" class="size-6" variant="destructive">
                                <Trash2 class="size-3 text-white" />
                              </Button>
                            </div>
                          </Show>

                          <For each={storage.invs}>
                            {(inventory) => (
                              <div
                                class={cn(
                                  "hover:bg-blue-200 dark:hover:bg-blue-600 active:bg-blue-300 dark:active:bg-blue-500 group/inv relative cursor-pointer",
                                  {
                                    "border-neutral-400 dark:border-neutral-500 border-r last:border-r-0":
                                      storage.variant === "vertical",
                                    "border-neutral-400 dark:border-neutral-500 border-b last:border-b-0":
                                      storage.variant === "horizontal",
                                  },
                                )}
                                style={
                                  storage.variant === "horizontal"
                                    ? {
                                        width: "100%",
                                        height: `calc(100%/${storage.invs.length})`,
                                      }
                                    : {
                                        width: `${storage.bounding_box.width / storage.invs.length}px`,
                                        height: "100%",
                                      }
                                }
                              >
                                <Show when={props.editing()}>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    class="absolute -top-2 -right-2 size-6 opacity-0 group-hover/inv:opacity-100"
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
