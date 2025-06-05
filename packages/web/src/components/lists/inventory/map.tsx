import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useColorModeValue } from "@kobalte/core";
import { type OrganizationInventoryInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import ZoomReset from "lucide-solid/icons/redo";
import X from "lucide-solid/icons/x";
import ZoomIn from "lucide-solid/icons/zoom-in";
import ZoomOut from "lucide-solid/icons/zoom-out";
import { Accessor, createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { drawGrid, isPointInStorage, setupCanvas } from "./canvas";
import { FacilitySelect, StorageType } from "./types";

type SpacePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  relative: boolean;
};

export function FacilityMap(props: {
  inventory: Accessor<OrganizationInventoryInfo>;
  selectedWarehouseId: Accessor<string | undefined>;
  selectedFacilityId: Accessor<string | undefined>;
  onWarehouseChange: (id: string | undefined) => void;
  onFacilityChange: (id: string | undefined) => void;
}) {
  let canvasRef: HTMLCanvasElement | undefined;
  const [zoom, setZoom] = createSignal(1);
  const [hoveredStorage, setHoveredStorage] = createSignal<{
    storage: StorageType;
    space?: StorageType["spaces"][0];
    x: number;
    y: number;
  } | null>(null);
  const [spacePositions, setSpacePositions] = createStore<Record<string, SpacePosition>>({});

  const storageBackgroundColor = useColorModeValue("hsla(220, 13%, 95%, 0.8)", "hsla(220, 13%, 25%, 0.8)");
  const progressBarColor = useColorModeValue("hsla(142, 76%, 36%, 0.8)", "hsla(142, 76%, 46%, 0.8)");
  const color2 = useColorModeValue("#e0e0e0", "#222222");
  const color3 = useColorModeValue("#e0e0e0", "#333333");
  const color4 = useColorModeValue("#000000", "#ffffff");
  const color5 = useColorModeValue("#666666", "#999999");

  const facilityOptions = () => {
    const warehouse = props.inventory().warehouses.find((w) => w.id === props.selectedWarehouseId());
    if (!warehouse) return [];
    return warehouse.facilities.map((facility) => ({
      id: facility.id,
      label: facility.name,
      value: facility.id,
    }));
  };

  const redrawFacilityMap = () => {
    if (!canvasRef || !props.selectedWarehouseId()) return;

    const selectedFacility = props
      .inventory()
      .warehouses.flatMap((w) => w.facilities)
      .find((f) => f.id === props.selectedFacilityId());

    if (!selectedFacility) return;

    // Calculate total bounds of all storages
    const bounds = selectedFacility.areas.reduce(
      (acc, area) => {
        area.storages.forEach((storage) => {
          const x = storage.boundingBox?.x ?? 0;
          const y = storage.boundingBox?.y ?? 0;
          const width = storage.boundingBox?.width ?? 100;
          const height = storage.boundingBox?.height ?? 100;

          acc.minX = Math.min(acc.minX, x);
          acc.minY = Math.min(acc.minY, y);
          acc.maxX = Math.max(acc.maxX, x + width);
          acc.maxY = Math.max(acc.maxY, y + height);
        });
        return acc;
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );

    const ctx = setupCanvas(canvasRef, canvasRef.offsetWidth, canvasRef.offsetHeight, zoom());
    if (!ctx) return;

    const totalWidth = bounds.maxX - bounds.minX;
    const totalHeight = bounds.maxY - bounds.minY;
    const padding = 50;

    ctx.clearRect(0, 0, canvasRef.width / zoom(), canvasRef.height / zoom());

    // Translate to center and account for minimum bounds
    ctx.save();
    ctx.translate(-bounds.minX + padding, -bounds.minY + padding);

    drawGrid(ctx, totalWidth + padding * 2, totalHeight + padding * 2, color2());

    selectedFacility.areas.forEach((area) => {
      area.storages.forEach((storage: StorageType) => {
        const x = storage.boundingBox?.x ?? 0;
        const y = storage.boundingBox?.y ?? 0;
        const width = storage.boundingBox?.width ?? 100;
        const height = storage.boundingBox?.height ?? 100;

        drawStorage(ctx, storage, x, y, width, height);
      });
    });

    ctx.restore();
  };

  const drawStorage = (
    ctx: CanvasRenderingContext2D,
    storage: StorageType,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    const cornerRadius = 8;
    const isWide = width > height;
    const padding = 8;
    const spaceGap = 4;

    // Draw main box
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius, y);
    ctx.lineTo(x + width - cornerRadius, y);
    ctx.arcTo(x + width, y, x + width, y + cornerRadius, cornerRadius);
    ctx.lineTo(x + width, y + height - cornerRadius);
    ctx.arcTo(x + width, y + height, x + width - cornerRadius, y + height, cornerRadius);
    ctx.lineTo(x + cornerRadius, y + height);
    ctx.arcTo(x, y + height, x, y + height - cornerRadius, cornerRadius);
    ctx.lineTo(x, y + cornerRadius);
    ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);
    ctx.closePath();

    ctx.fillStyle = storageBackgroundColor();
    ctx.fill();
    ctx.strokeStyle = color3();
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw storage name outside the box
    ctx.fillStyle = color4();
    ctx.font = "bold 12px system-ui";
    ctx.fillText(storage.name, x, y - 8);
    ctx.font = "11px system-ui";
    ctx.fillText(`${storage.currentOccupancy}/${storage.capacity}`, x + ctx.measureText(storage.name).width + 8, y - 8);

    // Calculate space dimensions based on orientation
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;
    const count = storage.spaces.length;

    if (isWide) {
      // Arrange horizontally
      const spaceWidth = (availableWidth - spaceGap * (count - 1)) / count;
      const spaceHeight = availableHeight;

      storage.spaces.forEach((space, i) => {
        const spaceX = x + padding + i * (spaceWidth + spaceGap);
        const spaceY = y + padding;

        ctx.fillStyle = space.products.length > 0 ? progressBarColor() : color3();
        ctx.fillRect(spaceX, spaceY, spaceWidth, spaceHeight);

        setSpacePositions({
          [space.id]: {
            x: spaceX - x,
            y: spaceY - y,
            width: spaceWidth,
            height: spaceHeight,
            relative: true,
          },
        });
      });
    } else {
      // Arrange vertically
      const spaceWidth = availableWidth;
      const spaceHeight = (availableHeight - spaceGap * (count - 1)) / count;

      storage.spaces.forEach((space, i) => {
        const spaceX = x + padding;
        const spaceY = y + padding + i * (spaceHeight + spaceGap);

        ctx.fillStyle = space.products.length > 0 ? progressBarColor() : color3();
        ctx.fillRect(spaceX, spaceY, spaceWidth, spaceHeight);

        setSpacePositions({
          [space.id]: {
            x: spaceX - x,
            y: spaceY - y,
            width: spaceWidth,
            height: spaceHeight,
            relative: true,
          },
        });
      });
    }
  };

  createEffect(() => {
    const selectedId = props.selectedFacilityId();
    if (selectedId) {
      redrawFacilityMap();
    }
  });

  onMount(() => {
    if (!canvasRef) return;
    const resizeObserver = new ResizeObserver(redrawFacilityMap);
    resizeObserver.observe(canvasRef);
    onCleanup(() => resizeObserver.disconnect());
  });

  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvasRef!.getBoundingClientRect();
    const selectedFacility = props
      .inventory()
      .warehouses.flatMap((w) => w.facilities)
      .find((f) => f.id === props.selectedFacilityId());

    if (!selectedFacility) return;

    // Calculate bounds to know our offset
    const bounds = selectedFacility.areas.reduce(
      (acc, area) => {
        area.storages.forEach((storage) => {
          const x = storage.boundingBox?.x ?? 0;
          const y = storage.boundingBox?.y ?? 0;
          acc.minX = Math.min(acc.minX, x);
          acc.minY = Math.min(acc.minY, y);
        });
        return acc;
      },
      { minX: Infinity, minY: Infinity },
    );

    const padding = 50;
    // Adjust mouse position to account for zoom, translation and padding
    const x = (e.clientX - rect.left) / zoom() + bounds.minX - padding;
    const y = (e.clientY - rect.top) / zoom() + bounds.minY - padding;

    let found = false;
    for (const area of selectedFacility.areas) {
      for (const storage of area.storages) {
        if (isPointInStorage(x, y, storage)) {
          for (const space of storage.spaces) {
            const pos = spacePositions[space.id];
            if (!pos) continue;

            const spaceX = (storage.boundingBox?.x ?? 0) + pos.x;
            const spaceY = (storage.boundingBox?.y ?? 0) + pos.y;

            if (x >= spaceX && x <= spaceX + pos.width && y >= spaceY && y <= spaceY + pos.height) {
              setHoveredStorage({ storage, space, x: e.clientX, y: e.clientY });
              found = true;
              break;
            }
          }

          if (!found) {
            setHoveredStorage({ storage, x: e.clientX, y: e.clientY });
          }
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      setHoveredStorage(null);
    }
  };

  return (
    <Show
      when={props.selectedWarehouseId()}
      fallback={
        <div class="w-full h-full aspect-square xl:h-auto xl:aspect-video relative border rounded-lg bg-background flex items-center justify-center">
          <div class="text-muted-foreground text-center text-sm select-none">
            <span>Please select a warehouse first</span>
          </div>
        </div>
      }
    >
      <div class="w-full h-full xl:h-auto aspect-square xl:aspect-video relative border rounded-lg bg-background">
        <div class="border-b flex flex-row items-center text-sm">
          <span class="px-4 border-r w-max">
            {props.inventory().warehouses.find((w: any) => w.id === props.selectedWarehouseId())?.name}
          </span>
          <Select<FacilitySelect>
            value={facilityOptions().find((f) => f.id === props.selectedFacilityId()) ?? null}
            onChange={(option) => props.onFacilityChange(option?.id)}
            options={facilityOptions()}
            optionValue="value"
            optionTextValue="label"
            placeholder="Select facility..."
            itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
          >
            <SelectTrigger aria-label="Facility" class="w-[200px] border-none rounded-none">
              <SelectValue<FacilitySelect>>
                {(state) => state.selectedOption()?.label || "Select facility..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
          <div class="flex flex-row gap-2 items-center justify-end flex-1 px-2">
            <Button
              variant="ghost"
              size="icon"
              class="p-1"
              onClick={() => {
                props.onFacilityChange(undefined);
                props.onWarehouseChange(undefined);
              }}
            >
              <X class="size-4" />
            </Button>
          </div>
        </div>

        <div class="w-full h-full p-4">
          <canvas
            ref={canvasRef!}
            class="w-full h-full xl:h-auto xl:aspect-video"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredStorage(null)}
          />
          <div class="absolute bottom-4 right-4 flex flex-col gap-2 h-auto">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                setZoom((prev) => Math.min(prev + 0.2, 3));
                redrawFacilityMap();
              }}
            >
              <ZoomIn class="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                setZoom((prev) => Math.max(prev - 0.2, 0.5));
                redrawFacilityMap();
              }}
            >
              <ZoomOut class="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                setZoom(1);
                redrawFacilityMap();
              }}
            >
              <ZoomReset class="size-4" />
            </Button>
          </div>
        </div>

        <Show when={hoveredStorage()}>
          <div
            class="fixed pointer-events-none bg-popover text-popover-foreground rounded-lg shadow-lg text-sm border"
            style={{
              left: `${hoveredStorage()!.x}px`,
              top: `${hoveredStorage()!.y}px`,
              "max-width": "300px",
            }}
          >
            <div class="font-medium p-2 px-3 border-b">
              {hoveredStorage()!.space ? hoveredStorage()!.space!.name : hoveredStorage()!.storage.name}
            </div>
            <div class="text-xs space-y-1 p-2 px-3">
              <Show
                when={hoveredStorage()!.space}
                fallback={
                  <>
                    <div>
                      Capacity: {hoveredStorage()!.storage.currentOccupancy}/{hoveredStorage()!.storage.capacity}
                    </div>
                    <div>Spaces: {hoveredStorage()!.storage.spaces.length}</div>
                  </>
                }
              >
                {(space) => (
                  <div>
                    <div>Barcode: {space().barcode}</div>
                    <div>Products: {space().products.length}</div>
                    <Show when={space().products.length > 0}>
                      <div class="mt-2 grid gap-1">
                        <For each={space().products}>
                          {(product) => (
                            <div class="bg-muted/50 rounded px-2 py-1">
                              <div>{product.name}</div>
                              <div class="text-muted-foreground">SKU: {product.sku}</div>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                )}
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
}
