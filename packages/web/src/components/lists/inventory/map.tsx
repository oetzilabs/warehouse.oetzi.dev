import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useColorModeValue } from "@kobalte/core";
import { type OrganizationInventoryInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import ZoomReset from "lucide-solid/icons/redo";
import X from "lucide-solid/icons/x";
import ZoomIn from "lucide-solid/icons/zoom-in";
import ZoomOut from "lucide-solid/icons/zoom-out";
import { Accessor, createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { drawGrid, isPointInStorage, setupCanvas } from "./canvas";
import { FacilitySelect, StorageType } from "./types";

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
    x: number;
    y: number;
  } | null>(null);
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
      .warehouses.flatMap((w: any) => w.facilities)
      .find((f: any) => f.id === props.selectedFacilityId());

    if (!selectedFacility) return;

    const ctx = setupCanvas(canvasRef, canvasRef.offsetWidth, canvasRef.offsetHeight, zoom());
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.width / zoom(), canvasRef.height / zoom());
    drawGrid(ctx, canvasRef.width / zoom(), canvasRef.height / zoom(), color2());

    selectedFacility.areas.forEach((area: any) => {
      area.storages.forEach((storage: StorageType) => {
        const x = storage.boundingBox?.x ?? 0;
        const y = storage.boundingBox?.y ?? 0;
        const width = storage.boundingBox?.width ?? 100;
        const height = storage.boundingBox?.height ?? 100;

        drawStorage(ctx, storage, x, y, width, height);
      });
    });
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

    // Draw box
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

    // Calculate occupancy
    const currentOccupancy = storage.currentOccupancy ?? 0;
    const capacity = storage.capacity || 1;
    const occupancyPercentage = Math.min(Math.max(currentOccupancy / capacity, 0), 1);

    // Fill and stroke
    ctx.fillStyle = storageBackgroundColor();
    ctx.fill();
    ctx.strokeStyle = color3();
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw text
    ctx.fillStyle = color4();
    ctx.font = "bold 12px system-ui";
    ctx.fillText(storage.name, x + 12, y + 24);
    ctx.font = "11px system-ui";
    ctx.fillText(`${storage.currentOccupancy}/${storage.capacity}`, x + 12, y + 44);

    // Draw progress bar
    const barWidth = width - 24;
    const barHeight = 6;
    const barX = x + 12;
    const barY = y + 52;

    ctx.fillStyle = color3();
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = progressBarColor();
    ctx.fillRect(barX, barY, barWidth * occupancyPercentage, barHeight);

    // Draw spaces count
    ctx.fillStyle = color5();
    ctx.font = "11px system-ui";
    ctx.fillText(`${storage.spaces.length} spaces`, x + 12, y + height - 12);
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
    const x = (e.clientX - rect.left) / zoom();
    const y = (e.clientY - rect.top) / zoom();

    const selectedFacility = props
      .inventory()
      .warehouses.flatMap((w: any) => w.facilities)
      .find((f: any) => f.id === props.selectedFacilityId());

    if (!selectedFacility) return;

    let found = false;
    for (const area of selectedFacility.areas) {
      for (const storage of area.storages) {
        if (isPointInStorage(x, y, storage)) {
          setHoveredStorage({ storage, x: e.clientX, y: e.clientY });
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
        <div class="w-full aspect-video relative border rounded-lg bg-background flex items-center justify-center">
          <div class="text-muted-foreground text-center text-sm select-none">
            <span>Please select a warehouse first</span>
          </div>
        </div>
      }
    >
      <div class="w-full aspect-video relative border rounded-lg bg-background">
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

        <div class="relative w-full h-[calc(100%-5rem)] p-4">
          <canvas
            ref={canvasRef!}
            class="w-full aspect-video"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredStorage(null)}
          />
          <div class="absolute -bottom-4 right-4 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                setZoom((prev) => Math.min(prev + 0.1, 3));
                redrawFacilityMap();
              }}
            >
              <ZoomIn class="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                setZoom((prev) => Math.max(prev - 0.1, 0.5));
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
            <div class="font-medium p-2 px-3 border-b">{hoveredStorage()!.storage.name}</div>
            <div class="text-xs space-y-1 p-2 px-3">
              <div>
                Capacity: {hoveredStorage()!.storage.currentOccupancy}/{hoveredStorage()!.storage.capacity}
              </div>
              <div>Spaces: {hoveredStorage()!.storage.spaces.length}</div>
              <div>
                Total Products: {hoveredStorage()!.storage.spaces.reduce((acc, s) => acc + s.products.length, 0)}
              </div>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
}
