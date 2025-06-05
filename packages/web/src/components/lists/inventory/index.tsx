import { FilterPopover } from "@/components/filters/popover";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { cn } from "@/lib/utils";
import { useColorModeValue } from "@kobalte/core";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { OrganizationInventoryInfo } from "@warehouseoetzidev/core/src/entities/organizations";
import ChevronRight from "lucide-solid/icons/chevron-right";
import ZoomReset from "lucide-solid/icons/redo";
import ZoomIn from "lucide-solid/icons/zoom-in";
import ZoomOut from "lucide-solid/icons/zoom-out";
import { Accessor, createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";

type InventoryListProps = {
  inventory: Accessor<OrganizationInventoryInfo>;
};

type FacilitySelect = {
  id: string;
  label: string;
  value: string;
};

type WarehouseSelect = {
  id: string;
  label: string;
  value: string;
};

export const InventoryList = (props: InventoryListProps) => {
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");
  const [selectedFacilityId, setSelectedFacilityId] = createSignal<string | undefined>();
  const [selectedWarehouseId, setSelectedWarehouseId] = createSignal<string | undefined>();
  const cmv = useColorModeValue("#e0e0e0", "#222222");
  const cmv2 = useColorModeValue(true, false);
  const cmv3 = useColorModeValue("#e0e0e0", "#333333");
  const cmv4 = useColorModeValue("#666666", "#999999");
  const cmv5 = useColorModeValue("#000000", "#ffffff");

  const storageBackgroundColor = useColorModeValue("hsla(220, 13%, 95%, 0.8)", "hsla(220, 13%, 25%, 0.8)");
  const progressBarColor = useColorModeValue("hsla(142, 76%, 36%, 0.8)", "hsla(142, 76%, 46%, 0.8)");

  const defaultSort = {
    default: "name",
    current: "name",
    direction: "desc" as const,
    variants: [
      {
        field: "name",
        label: "Name",
        fn: (a: OrganizationInventoryInfo["warehouses"][0], b: OrganizationInventoryInfo["warehouses"][0]) => {
          return a.name.localeCompare(b.name);
        },
      },
      {
        field: "capacity",
        label: "Total Capacity",
        fn: (a: OrganizationInventoryInfo["warehouses"][0], b: OrganizationInventoryInfo["warehouses"][0]) => {
          const aCapacity = a.facilities.reduce(
            (acc, f) =>
              acc + f.areas.reduce((acc2, ar) => acc2 + ar.storages.reduce((acc3, s) => acc3 + s.capacity, 0), 0),
            0,
          );
          const bCapacity = b.facilities.reduce(
            (acc, f) =>
              acc + f.areas.reduce((acc2, ar) => acc2 + ar.storages.reduce((acc3, s) => acc3 + s.capacity, 0), 0),
            0,
          );
          return aCapacity - bCapacity;
        },
      },
    ],
  } as FilterConfig<OrganizationInventoryInfo["warehouses"][0]>["sort"];

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<OrganizationInventoryInfo["warehouses"][0]>>({
    disabled: () => props.inventory().warehouses.length === 0,
    dateRange: {
      start: new Date(),
      end: new Date(),
      preset: "clear",
    },
    search: {
      term: dsearch(),
      fields: ["name", "description"],
      fuseOptions: { keys: ["name", "description"] },
    },
    sort: defaultSort,
    filter: {
      default: null,
      current: null,
      variants: [],
    },
  });

  const debouncedSearch = leadingAndTrailing(
    debounce,
    (text: string) => {
      setDSearch(text);
      setFilterConfig((prev) => ({ ...prev, search: { ...prev.search!, term: text } }));
    },
    500,
  );

  const filteredData = useFilter(() => props.inventory().warehouses, filterConfig);

  const [expandedWarehouses, setExpandedWarehouses] = createSignal<Set<string>>(new Set());
  const [expandedFacilities, setExpandedFacilities] = createSignal<Set<string>>(new Set());
  const [expandedAreas, setExpandedAreas] = createSignal<Set<string>>(new Set());
  const [expandedStorages, setExpandedStorages] = createSignal<Set<string>>(new Set());
  const [areaZoomLevels, setAreaZoomLevels] = createStore<Record<string, number>>({});

  const toggleExpand = (set: Set<string>, setFn: (value: Set<string>) => void, id: string) => {
    const newSet = new Set(set);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setFn(newSet);
  };

  const renderProducts = (
    products: OrganizationInventoryInfo["warehouses"][0]["facilities"][0]["areas"][0]["storages"][0]["spaces"][0]["products"],
  ) => (
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-2">
      <For each={products}>
        {(product) => (
          <div class="bg-muted/30 rounded p-2 text-xs">
            <div class="font-medium">{product.name}</div>
            <div class="text-muted-foreground">SKU: {product.sku}</div>
          </div>
        )}
      </For>
    </div>
  );

  const renderSpace = (
    space: OrganizationInventoryInfo["warehouses"][0]["facilities"][0]["areas"][0]["storages"][0]["spaces"][0],
  ) => (
    <Card class="p-3">
      <div class="flex items-center justify-between">
        <div>
          <div class="font-medium text-sm">{space.name}</div>
          <div class="text-xs text-muted-foreground">Barcode: {space.barcode}</div>
        </div>
        <Badge variant="outline">{space.products.length} Products</Badge>
      </div>
      <Show when={space.products.length > 0}>{renderProducts(space.products)}</Show>
    </Card>
  );

  const renderStorage = (
    storage: OrganizationInventoryInfo["warehouses"][0]["facilities"][0]["areas"][0]["storages"][0],
  ) => {
    const isExpanded = () => expandedStorages().has(storage.id);
    return (
      <AccordionItem value={storage.id} class="border rounded-lg p-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              class="shrink-0"
              onClick={() => toggleExpand(expandedStorages(), setExpandedStorages, storage.id)}
            >
              <ChevronRight class={cn("size-4 transition-transform", isExpanded() && "rotate-90")} />
            </Button>
            <div>
              <div class="font-medium text-sm">{storage.name}</div>
              <div class="text-xs text-muted-foreground">
                Capacity: {storage.currentOccupancy}/{storage.capacity}
              </div>
            </div>
          </div>
          <Badge variant="outline">{storage.spaces.length} Spaces</Badge>
        </div>
        <Show when={isExpanded()}>
          <div class="mt-2 pl-6 space-y-2">
            <For each={storage.spaces}>{renderSpace}</For>
          </div>
        </Show>
      </AccordionItem>
    );
  };

  const setupCanvas = (canvas: HTMLCanvasElement, width: number, height: number, zoom: number = 1) => {
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr * zoom, dpr * zoom);
    }
    return ctx;
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    ctx.fillStyle = cmv();

    // Draw dots instead of lines
    for (let x = gridSize; x < width; x += gridSize) {
      for (let y = gridSize; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawStorage = (
    ctx: CanvasRenderingContext2D,
    storage: OrganizationInventoryInfo["warehouses"][0]["facilities"][0]["areas"][0]["storages"][0],
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    const cornerRadius = 8;

    // Draw main box without shadow
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

    // Draw main box
    ctx.fillStyle = storageBackgroundColor();
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = cmv3();
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw storage info
    ctx.fillStyle = cmv5();
    ctx.font = "bold 12px system-ui";
    ctx.fillText(storage.name, x + 12, y + 24);

    ctx.font = "11px system-ui";
    ctx.fillText(`${storage.currentOccupancy}/${storage.capacity}`, x + 12, y + 44);

    // Draw occupancy bar
    const barWidth = width - 24;
    const barHeight = 6;
    const barX = x + 12;
    const barY = y + 52;

    // Background
    ctx.fillStyle = cmv3();
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Fill with fixed color
    ctx.fillStyle = progressBarColor();
    ctx.fillRect(barX, barY, barWidth * occupancyPercentage, barHeight);

    // Spaces indicator
    ctx.fillStyle = cmv4();
    ctx.font = "11px system-ui";
    ctx.fillText(`${storage.spaces.length} spaces`, x + 12, y + height - 12);
  };

  const renderArea = (area: OrganizationInventoryInfo["warehouses"][0]["facilities"][0]["areas"][0]) => {
    const isExpanded = () => expandedAreas().has(area.id);
    let canvasRef: HTMLCanvasElement | undefined;

    // Initialize zoom level for this area if not exists
    if (!areaZoomLevels[area.id]) {
      setAreaZoomLevels(area.id, 1);
    }

    const redrawAreaMap = () => {
      if (!canvasRef || !isExpanded()) return;

      const zoom = areaZoomLevels[area.id];
      const CANVAS_HEIGHT = 400; // Fixed height for better map view
      const ctx = setupCanvas(canvasRef, canvasRef.offsetWidth, CANVAS_HEIGHT, zoom);
      if (!ctx) return;

      // Clear and draw grid
      ctx.clearRect(0, 0, canvasRef.width / zoom, canvasRef.height / zoom);
      drawGrid(ctx, canvasRef.width / zoom, CANVAS_HEIGHT);

      // Draw storages with actual positions
      area.storages.forEach((storage) => {
        const x = storage.boundingBox?.x ?? 0;
        const y = storage.boundingBox?.y ?? 0;
        const width = storage.boundingBox?.width ?? 100;
        const height = storage.boundingBox?.height ?? 100;

        drawStorage(ctx, storage, x, y, width, height);
      });
    };

    createEffect(() => {
      const isVisible = isExpanded();
      if (isVisible) {
        redrawAreaMap();
      }
    });

    // Handle resize
    onMount(() => {
      if (!canvasRef) return;
      const resizeObserver = new ResizeObserver(redrawAreaMap);
      resizeObserver.observe(canvasRef);
      onCleanup(() => resizeObserver.disconnect());
    });

    return (
      <AccordionItem value={area.id} class="border rounded-lg p-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              class="shrink-0"
              onClick={() => toggleExpand(expandedAreas(), setExpandedAreas, area.id)}
            >
              <ChevronRight class={cn("size-4 transition-transform", isExpanded() && "rotate-90")} />
            </Button>
            <div>
              <div class="font-medium text-sm">{area.name}</div>
              <div class="text-xs text-muted-foreground">{area.description}</div>
            </div>
          </div>
          <Badge variant="outline">{area.storages.length} Storages</Badge>
        </div>
        <Show when={isExpanded()}>
          <div class="mt-2 pl-6 space-y-4">
            <div class="w-full relative">
              <canvas ref={canvasRef!} class="w-full h-[400px] rounded-lg border bg-background" />
              {/* Zoom controls */}
              <div class="absolute bottom-4 right-4 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  class="p-1"
                  onClick={() => {
                    setAreaZoomLevels(area.id, Math.min(areaZoomLevels[area.id] + 0.1, 3));
                    redrawAreaMap();
                  }}
                >
                  <ZoomIn class="size-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  class="p-1"
                  onClick={() => {
                    setAreaZoomLevels(area.id, Math.max(areaZoomLevels[area.id] - 0.1, 0.5));
                    redrawAreaMap();
                  }}
                >
                  <ZoomOut class="size-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  class="p-1"
                  onClick={() => {
                    setAreaZoomLevels(area.id, 1);
                    redrawAreaMap();
                  }}
                >
                  <ZoomReset class="size-4" />
                </Button>
              </div>
            </div>
            <div class="space-y-2">
              <For each={area.storages}>{renderStorage}</For>
            </div>
          </div>
        </Show>
      </AccordionItem>
    );
  };

  const renderFacility = (facility: OrganizationInventoryInfo["warehouses"][0]["facilities"][0]) => {
    const isExpanded = () => expandedFacilities().has(facility.id);
    return (
      <AccordionItem value={facility.id} class="border rounded-lg p-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              class="shrink-0"
              onClick={() => toggleExpand(expandedFacilities(), setExpandedFacilities, facility.id)}
            >
              <ChevronRight class={cn("size-4 transition-transform", isExpanded() && "rotate-90")} />
            </Button>
            <div>
              <div class="font-medium text-sm">{facility.name}</div>
              <div class="text-xs text-muted-foreground">{facility.description}</div>
            </div>
          </div>
          <Badge variant="outline">{facility.areas.length} Areas</Badge>
        </div>
        <Show when={isExpanded()}>
          <div class="p-4 space-y-4">
            <For each={facility.areas}>{renderArea}</For>
          </div>
        </Show>
      </AccordionItem>
    );
  };

  const renderWarehouseCard = (warehouse: OrganizationInventoryInfo["warehouses"][0]) => {
    const isSelected = () => selectedWarehouseId() === warehouse.id;
    const totalCapacity = warehouse.facilities.reduce(
      (acc, f) => acc + f.areas.reduce((acc2, ar) => acc2 + ar.storages.reduce((acc3, s) => acc3 + s.capacity, 0), 0),
      0,
    );
    const currentOccupancy = warehouse.facilities.reduce(
      (acc, f) =>
        acc +
        f.areas.reduce((acc2, ar) => acc2 + ar.storages.reduce((acc3, s) => acc3 + (s.currentOccupancy || 0), 0), 0),
      0,
    );
    const occupancyPercentage = (currentOccupancy / totalCapacity) * 100;

    return (
      <Card
        class={cn("p-4 cursor-pointer transition-colors hover:bg-muted/50", isSelected() && "ring-2 ring-primary")}
        onClick={() => handleWarehouseSelect(warehouse.id)}
      >
        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold">{warehouse.name}</h3>
            <Badge variant="outline">{warehouse.facilities.length} Facilities</Badge>
          </div>
          <p class="text-sm text-muted-foreground">{warehouse.description}</p>
          <div class="space-y-1">
            <div class="text-sm flex justify-between">
              <span>Occupancy</span>
              <span>
                {currentOccupancy}/{totalCapacity}
              </span>
            </div>
            <Progress value={occupancyPercentage} class="h-2" />
          </div>
        </div>
      </Card>
    );
  };

  const facilityOptions = () => {
    const warehouse = props.inventory().warehouses.find((w) => w.id === selectedWarehouseId());
    if (!warehouse) return [];
    return warehouse.facilities.map((facility) => ({
      id: facility.id,
      label: facility.name,
      value: facility.id,
    }));
  };

  const handleWarehouseSelect = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId);
    const warehouse = props.inventory().warehouses.find((w) => w.id === warehouseId);
    if ((warehouse?.facilities.length ?? 0) > 0) {
      setSelectedFacilityId(warehouse?.facilities[0].id ?? "");
    }
  };

  let canvasRef: HTMLCanvasElement | undefined;
  const [zoom, setZoom] = createSignal(1);

  const redrawFacilityMap = () => {
    if (!canvasRef || !selectedWarehouseId()) return;

    const selectedFacility = props
      .inventory()
      .warehouses.flatMap((w) => w.facilities)
      .find((f) => f.id === selectedFacilityId());

    if (!selectedFacility) return;

    const ctx = setupCanvas(canvasRef, canvasRef.offsetWidth, canvasRef.offsetHeight, zoom());
    if (!ctx) return;

    // Clear and draw grid
    ctx.clearRect(0, 0, canvasRef.width / zoom(), canvasRef.height / zoom());
    drawGrid(ctx, canvasRef.width / zoom(), canvasRef.height / zoom());

    // Draw all storages from all areas in the facility
    selectedFacility.areas.forEach((area) => {
      area.storages.forEach((storage) => {
        const x = storage.boundingBox?.x ?? 0;
        const y = storage.boundingBox?.y ?? 0;
        const width = storage.boundingBox?.width ?? 100;
        const height = storage.boundingBox?.height ?? 100;

        drawStorage(ctx, storage, x, y, width, height);
      });
    });
  };

  createEffect(() => {
    if (selectedFacilityId()) {
      redrawFacilityMap();
    }
  });

  const renderFacilityMap = () => {
    if (!selectedWarehouseId()) {
      return (
        <div class="w-full h-[600px] relative border rounded-lg bg-background flex items-center justify-center">
          <div class="text-muted-foreground text-center text-sm select-none">
            <span>Please select a warehouse first</span>
          </div>
        </div>
      );
    }

    return (
      <div class="w-full h-[600px] relative border rounded-lg bg-background">
        <div class="p-4 border-b flex gap-4">
          <Select<WarehouseSelect>
            value={
              props
                .inventory()
                .warehouses.map((w) => ({ id: w.id, label: w.name, value: w.id }))
                .find((w) => w.id === selectedWarehouseId()) ?? null
            }
            onChange={(option) => handleWarehouseSelect(option?.id ?? "")}
            options={props.inventory().warehouses.map((w) => ({ id: w.id, label: w.name, value: w.id }))}
            optionValue="value"
            optionTextValue="label"
            placeholder="Select warehouse..."
            itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
          >
            <SelectTrigger aria-label="Warehouse" class="w-[200px]">
              <SelectValue<WarehouseSelect>>
                {(state) => state.selectedOption()?.label || "Select warehouse..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>

          <Select<FacilitySelect>
            value={facilityOptions().find((f) => f.id === selectedFacilityId()) ?? null}
            onChange={(option) => setSelectedFacilityId(option?.id ?? "")}
            options={facilityOptions()}
            optionValue="value"
            optionTextValue="label"
            placeholder="Select facility..."
            itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
          >
            <SelectTrigger aria-label="Facility" class="w-[200px]">
              <SelectValue<FacilitySelect>>
                {(state) => state.selectedOption()?.label || "Select facility..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>

        <div class="relative w-full h-[calc(100%-5rem)] p-4">
          <canvas ref={canvasRef!} class="w-full h-full" />
          <div class="absolute bottom-4 right-4 flex flex-col gap-2">
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
      </div>
    );
  };

  // Add resize handling
  onMount(() => {
    if (!canvasRef) return;
    const resizeObserver = new ResizeObserver(redrawFacilityMap);
    resizeObserver.observe(canvasRef);
    onCleanup(() => resizeObserver.disconnect());
  });

  const totalStats = () => {
    const { totalWarehouses, stats } = props.inventory();
    return [
      { label: "Warehouses", value: totalWarehouses },
      { label: "Facilities", value: stats.totalFacilities },
      { label: "Areas", value: stats.totalAreas },
      { label: "Storages", value: stats.totalStorages },
      { label: "Spaces", value: stats.totalSpaces },
      { label: "Products", value: stats.totalProducts },
    ];
  };

  return (
    <div class="w-full flex flex-col gap-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <For each={filteredData()}>{renderWarehouseCard}</For>
      </div>

      {renderFacilityMap()}
    </div>
  );
};
