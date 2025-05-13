import { Authenticated } from "@/components/Authenticated";
import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
import { useUser } from "@/components/providers/User";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from "@/components/ui/number-field";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import {
  addWarehouseArea,
  changeWarehouse,
  changeWarehouseDimensions,
  updateWarehouseArea,
} from "@/lib/api/warehouses";
import { cn } from "@/lib/utils";
import { cookieStorage, makePersisted } from "@solid-primitives/storage";
import { RouteDefinition, useAction, useSubmission } from "@solidjs/router";
import { type WarehouseAreaSelect } from "@warehouseoetzidev/core/src/drizzle/sql/schema";
import Check from "lucide-solid/icons/check";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import ZoomReset from "lucide-solid/icons/redo";
import ZoomIn from "lucide-solid/icons/zoom-in";
import ZoomOut from "lucide-solid/icons/zoom-out";
import { createSignal, For, onCleanup, onMount, Show, Suspense } from "solid-js";
import { createStore } from "solid-js/store";
import { toast } from "solid-sonner";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    return { user, sessionToken };
  },
} as RouteDefinition;

export default function DashboardPage() {
  const user = useUser();

  const { setBreadcrumbs } = useBreadcrumbs();

  const changeWarehouseAction = useAction(changeWarehouse);
  const isChangingWarehouse = useSubmission(changeWarehouse);

  onMount(() => {
    setBreadcrumbs([
      {
        label: "Map",
        href: "/map",
      },
    ]);
  });

  const [mapConfig, setMapConfig] = makePersisted(
    createStore({
      zoom: 1,
    }),
    { name: "warehouse-map-zoom", storage: cookieStorage },
  );

  const [mapStore, setMapStore] = createStore({
    dimensions: {
      width: 200,
      height: 200,
    },
    areas: [] as WarehouseAreaSelect[],
  });

  onMount(() => {
    const dimensions = user.currentWarehouse()?.dimensions;
    if (!dimensions) return;
    const areas = user.currentWarehouse()?.areas;
    setMapStore({
      dimensions,
      areas,
    });
  });

  const changeWarehouseDimensionsAction = useAction(changeWarehouseDimensions);
  const isChangingWarehouseDimensions = useSubmission(changeWarehouseDimensions);

  const addAreaAction = useAction(addWarehouseArea);
  const isAddingArea = useSubmission(addWarehouseArea);

  const updateAreaAction = useAction(updateWarehouseArea);
  const isSavingArea = useSubmission(updateWarehouseArea);

  const resetArea = {
    id: "",
    bounding_box: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    },
  };

  const [selectedArea, setSelectedArea] = createStore(resetArea);

  let mapAreaRef: HTMLDivElement | undefined;

  onMount(() => {
    const keybinds: Record<string, () => void> = {
      Escape: () => {
        setSelectedArea(resetArea);
      },
    };

    const handler = (e: KeyboardEvent) => {
      if (Object.hasOwn(keybinds, e.key)) {
        keybinds[e.key]();
      }
    };

    document.addEventListener("keydown", handler);
    onCleanup(() => {
      document.removeEventListener("keydown", handler);
    });
  });

  return (
    <Authenticated skipOnboarding={false}>
      {(u) => (
        <div class="w-full h-full flex">
          <div class="w-full h-full flex flex-col border-t">
            <Suspense
              fallback={
                <div class="w-full h-full flex items-center justify-center">
                  <Loader2 class="size-4 animate-spin"></Loader2>
                </div>
              }
            >
              <Show when={u.user.whs}>
                {(whs) => (
                  <div class="w-full h-full flex flex-row">
                    <div class="w-full h-full bg-muted/50">
                      <div
                        class="w-full h-full flex flex-col relative"
                        ref={mapAreaRef!}
                        onClick={(e) => {
                          if (e.target === mapAreaRef) {
                            setSelectedArea(resetArea);
                          }
                        }}
                      >
                        <Show when={user.ready()}>
                          <div
                            class="border border-neutral-300 dark:border-neutral-700 bg-muted absolute top-[50%] left-[50%] rounded-sm p-1"
                            style={{
                              width: `${mapStore.dimensions.width}px`,
                              height: `${mapStore.dimensions.height}px`,
                              transform: `translate(-50%, -50%) scale(${mapConfig.zoom}) `,
                            }}
                          >
                            <div class="w-full h-full relative">
                              <For each={mapStore.areas}>
                                {(area) => (
                                  <div
                                    class={cn(
                                      "bg-neutral-200 dark:bg-neutral-700  bg-muted absolute rounded-[calc(var(--radius)-6px)]",
                                      {
                                        "outline-1 outline-offset-2 outline-dashed bg-neutral-300 dark:bg-neutral-600 ":
                                          selectedArea.id === area.id,
                                      },
                                    )}
                                    style={{
                                      width: `${area.bounding_box.width}px`,
                                      height: `${area.bounding_box.height}px`,
                                      transform: `translate(${area.bounding_box.x}px, ${area.bounding_box.y}px)`,
                                    }}
                                    onClick={() => setSelectedArea(area)}
                                  ></div>
                                )}
                              </For>
                            </div>
                          </div>
                        </Show>
                        <div class="w-max h-content flex flex-row items-center bottom-2 right-2 border absolute gap-1 p-1 rounded-md bg-background">
                          <Tooltip>
                            <TooltipTrigger
                              as={Button}
                              size="icon"
                              class="size-8"
                              variant="secondary"
                              onClick={() => {
                                setMapConfig("zoom", (z) => Math.min(z + 0.1, 1.4));
                              }}
                            >
                              <ZoomIn class="size-4" />
                            </TooltipTrigger>
                            <TooltipContent>Zoom In</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              as={Button}
                              size="icon"
                              class="size-8"
                              variant="secondary"
                              onClick={() => {
                                setMapConfig("zoom", (z) => Math.max(z - 0.1, 0.5));
                              }}
                            >
                              <ZoomOut class="size-4" />
                            </TooltipTrigger>
                            <TooltipContent>Zoom Out</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              as={Button}
                              size="icon"
                              class="size-8"
                              variant="secondary"
                              onClick={() => {
                                setMapConfig("zoom", 1);
                              }}
                            >
                              <ZoomReset class="size-4" />
                            </TooltipTrigger>
                            <TooltipContent>Zoom Reset</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                    <div class="w-[400px] h-full border-l">
                      <div class="flex flex-col w-full">
                        <Show
                          when={user.currentWarehouse()}
                          fallback={
                            <div class="w-full h-full flex flex-col">
                              <div class="flex flex-col gap-1">
                                <p class="text-xs leading-none text-muted-foreground">No warehouse selected</p>
                              </div>
                            </div>
                          }
                        >
                          {(w) => (
                            <div class="w-full h-full flex flex-col">
                              <div class="flex flex-col gap-1 p-2 border-b">
                                <div class="flex flex-row items-center justify-between w-full">
                                  <p class="text-sm leading-none font-bold">{w().name}</p>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      as={Button}
                                      size="sm"
                                      class="h-8"
                                      variant="secondary"
                                      disabled={
                                        isChangingWarehouse.pending ||
                                        (user.currentWarehouse()?.id === w().id && whs().length === 1)
                                      }
                                    >
                                      Change
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <For
                                        each={whs()}
                                        fallback={<DropdownMenuItem disabled>No warehouses</DropdownMenuItem>}
                                      >
                                        {(w) => (
                                          <DropdownMenuItem
                                            disabled={
                                              w.warehouseId === user.currentWarehouse()?.id ||
                                              isChangingWarehouse.pending
                                            }
                                            onSelect={() => {
                                              toast.promise(changeWarehouseAction(w.warehouseId), {
                                                loading: "Changing warehouse...",
                                                success: "Warehouse changed successfully.",
                                                error: "Error changing warehouse",
                                              });
                                            }}
                                          >
                                            <Show when={w.warehouseId === user.currentWarehouse()?.id}>
                                              <Check class="size-4" />
                                            </Show>
                                            {w.warehouse.name}
                                            <Show when={isChangingWarehouse.pending}>
                                              <Loader2 class="size-4 animate-spin" />
                                            </Show>
                                          </DropdownMenuItem>
                                        )}
                                      </For>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <div class="flex flex-col gap-1 p-2 border-b">
                                <div class="flex flex-col w-full gap-2">
                                  <p class="text-sm leading-none  font-bold">Dimensions</p>
                                  <div class="flex flex-col gap-2 items-center">
                                    <NumberField
                                      class="w-full"
                                      value={mapStore.dimensions.width}
                                      defaultValue={w().dimensions?.width}
                                      onRawValueChange={(v) => {
                                        if (Number.isNaN(v)) {
                                          setMapStore("dimensions", "width", 0);
                                          return;
                                        }
                                        setMapStore("dimensions", "width", v);
                                      }}
                                    >
                                      <NumberFieldLabel>Width</NumberFieldLabel>
                                      <NumberFieldGroup>
                                        <NumberFieldInput />
                                        <NumberFieldIncrementTrigger />
                                        <NumberFieldDecrementTrigger />
                                      </NumberFieldGroup>
                                    </NumberField>
                                    <NumberField
                                      class="w-full"
                                      value={mapStore.dimensions.height}
                                      defaultValue={w().dimensions?.height}
                                      onRawValueChange={(v) => {
                                        if (Number.isNaN(v)) {
                                          setMapStore("dimensions", "height", 0);
                                          return;
                                        }
                                        setMapStore("dimensions", "height", v);
                                      }}
                                    >
                                      <NumberFieldLabel>Height</NumberFieldLabel>
                                      <NumberFieldGroup>
                                        <NumberFieldInput />
                                        <NumberFieldIncrementTrigger />
                                        <NumberFieldDecrementTrigger />
                                      </NumberFieldGroup>
                                    </NumberField>
                                    <div class="flex flex-row items-center justify-between w-full">
                                      <div class=""></div>
                                      <div class="flex flex-row gap-1">
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => {
                                            setMapStore("dimensions", "width", w().dimensions?.width ?? 0);
                                            setMapStore("dimensions", "height", w().dimensions?.height ?? 0);
                                          }}
                                        >
                                          Reset
                                        </Button>
                                        <Button
                                          size="sm"
                                          disabled={isChangingWarehouseDimensions.pending}
                                          onClick={() => {
                                            const id = w().id;
                                            if (!id) {
                                              toast.error("Please select a warehouse first.");
                                              return;
                                            }
                                            console.log(id);
                                            toast.promise(
                                              changeWarehouseDimensionsAction({
                                                ...mapStore.dimensions,
                                                id,
                                              }),
                                              {
                                                loading: "Changing warehouse dimensions...",
                                                success: "Warehouse dimensions changed successfully.",
                                                error: "Error changing warehouse dimensions",
                                              },
                                            );
                                          }}
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="flex flex-col gap-1 p-2 border-b">
                                <div class="flex flex-col w-full gap-2">
                                  <p class="text-sm leading-none font-bold">Areas</p>
                                  <div class="flex flex-col gap-2 items-center">
                                    <For
                                      each={w().areas}
                                      fallback={
                                        <div class="w-full h-full flex flex-col">
                                          <div class="flex flex-col gap-2 w-full py-4 bg-muted text-muted-foreground items-center text-sm rounded-md border">
                                            No areas
                                            <Button
                                              size="sm"
                                              class="w-max"
                                              disabled={isAddingArea.pending}
                                              onClick={() => {
                                                toast.promise(
                                                  addAreaAction({
                                                    warehouse_facility_id: w().id,
                                                    name: "New Area",
                                                    bounding_box: {
                                                      x: 0,
                                                      y: 0,
                                                      width: 100,
                                                      height: 100,
                                                    },
                                                  }),
                                                  {
                                                    loading: "Adding area...",
                                                    success: "Area added successfully.",
                                                    error: "Error adding area",
                                                  },
                                                );
                                              }}
                                            >
                                              Add Area
                                              <Plus class="size-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      }
                                    >
                                      {(area) => (
                                        <div class="w-full -2 border-b last:border-b-0">
                                          <div class="flex flex-row items-center gap-1 justify-between">
                                            <span class="font-medium text-sm">{area.name}</span>
                                            <Show when={selectedArea.id === area.id}>
                                              <Badge variant="outline">selected</Badge>
                                            </Show>
                                          </div>
                                          <Show when={selectedArea.id === area.id}>
                                            <div class="flex flex-col items-center gap-1">
                                              <NumberField
                                                class="w-full"
                                                value={
                                                  mapStore.areas[mapStore.areas.findIndex((a) => a.id === area.id)]
                                                    ?.bounding_box.width ?? area.bounding_box.width
                                                }
                                                defaultValue={area.bounding_box.width}
                                                onRawValueChange={(v) => {
                                                  let vv = Number(v);
                                                  if (Number.isNaN(vv)) {
                                                    vv = 0;
                                                  }
                                                  // find area with the same id
                                                  const a = mapStore.areas.findIndex((a) => a.id === area.id);
                                                  if (a === -1) {
                                                    return;
                                                  }
                                                  setMapStore("areas", a, "bounding_box", "width", vv);
                                                }}
                                              >
                                                <NumberFieldLabel>Width</NumberFieldLabel>
                                                <NumberFieldGroup>
                                                  <NumberFieldInput />
                                                  <NumberFieldIncrementTrigger />
                                                  <NumberFieldDecrementTrigger />
                                                </NumberFieldGroup>
                                              </NumberField>
                                              <NumberField
                                                class="w-full"
                                                value={
                                                  mapStore.areas[mapStore.areas.findIndex((a) => a.id === area.id)]
                                                    ?.bounding_box.height ?? area.bounding_box.height
                                                }
                                                defaultValue={area.bounding_box.height}
                                                onRawValueChange={(v) => {
                                                  let vv = Number(v);
                                                  if (Number.isNaN(vv)) {
                                                    vv = 0;
                                                  }
                                                  // find area with the same id
                                                  const a = mapStore.areas.findIndex((a) => a.id === area.id);
                                                  if (a === -1) {
                                                    return;
                                                  }
                                                  setMapStore("areas", a, "bounding_box", "height", vv);
                                                }}
                                              >
                                                <NumberFieldLabel>Height</NumberFieldLabel>
                                                <NumberFieldGroup>
                                                  <NumberFieldInput />
                                                  <NumberFieldIncrementTrigger />
                                                  <NumberFieldDecrementTrigger />
                                                </NumberFieldGroup>
                                              </NumberField>
                                              <NumberField
                                                step={10}
                                                class="w-full"
                                                value={
                                                  mapStore.areas[mapStore.areas.findIndex((a) => a.id === area.id)]
                                                    ?.bounding_box.x ?? area.bounding_box.x
                                                }
                                                defaultValue={area.bounding_box.x}
                                                onRawValueChange={(v) => {
                                                  let vv = Number(v);
                                                  if (Number.isNaN(vv)) {
                                                    vv = 0;
                                                  }
                                                  // find area with the same id
                                                  const a = mapStore.areas.findIndex((a) => a.id === area.id);
                                                  if (a === -1) {
                                                    return;
                                                  }
                                                  setMapStore("areas", a, "bounding_box", "x", vv);
                                                }}
                                              >
                                                <NumberFieldLabel>X Position</NumberFieldLabel>
                                                <NumberFieldGroup>
                                                  <NumberFieldInput />
                                                  <NumberFieldIncrementTrigger />
                                                  <NumberFieldDecrementTrigger />
                                                </NumberFieldGroup>
                                              </NumberField>
                                              <NumberField
                                                step={10}
                                                class="w-full"
                                                defaultValue={area.bounding_box.y}
                                                value={
                                                  mapStore.areas[mapStore.areas.findIndex((a) => a.id === area.id)]
                                                    ?.bounding_box.y ?? area.bounding_box.y
                                                }
                                                onRawValueChange={(v) => {
                                                  let vv = Number(v);
                                                  if (Number.isNaN(vv)) {
                                                    vv = 0;
                                                  }
                                                  // find area with the same id
                                                  const a = mapStore.areas.findIndex((a) => a.id === area.id);
                                                  if (a === -1) {
                                                    return;
                                                  }
                                                  setMapStore("areas", a, "bounding_box", "y", vv);
                                                }}
                                              >
                                                <NumberFieldLabel>Y Position</NumberFieldLabel>
                                                <NumberFieldGroup>
                                                  <NumberFieldInput />
                                                  <NumberFieldIncrementTrigger />
                                                  <NumberFieldDecrementTrigger />
                                                </NumberFieldGroup>
                                              </NumberField>
                                              <div class="w-full items-center flex flex-row justify-end gap-2">
                                                <Button
                                                  disabled={isSavingArea.pending}
                                                  size="sm"
                                                  variant="secondary"
                                                  onClick={() => {
                                                    setSelectedArea({
                                                      id: area.id,
                                                      bounding_box: {
                                                        x: area.bounding_box.x,
                                                        y: area.bounding_box.y,
                                                        width: area.bounding_box.width,
                                                        height: area.bounding_box.height,
                                                      },
                                                    });
                                                    const aIndex = mapStore.areas.findIndex((a) => a.id === area.id);
                                                    if (aIndex === -1) {
                                                      console.error("Area not found");
                                                      return;
                                                    }
                                                    setMapStore("areas", aIndex, area);
                                                  }}
                                                >
                                                  Reset
                                                </Button>
                                                <Button
                                                  disabled={isSavingArea.pending}
                                                  size="sm"
                                                  onClick={() => {
                                                    const a = mapStore.areas.find((a) => a.id === area.id);
                                                    if (!a) {
                                                      return;
                                                    }

                                                    toast.promise(updateAreaAction({ ...a, id: area.id }), {
                                                      loading: "Saving area...",
                                                      success: "Area saved successfully.",
                                                      error: "Error saving area",
                                                    });
                                                  }}
                                                >
                                                  Save
                                                </Button>
                                              </div>
                                            </div>
                                          </Show>
                                        </div>
                                      )}
                                    </For>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Show>
                      </div>
                    </div>
                  </div>
                )}
              </Show>
            </Suspense>
          </div>
        </div>
      )}
    </Authenticated>
  );
}
