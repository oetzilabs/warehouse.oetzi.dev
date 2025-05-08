import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from "@/components/ui/number-field";
import { changeWarehouseDimensions } from "@/lib/api/warehouses";
import { useColorModeValue } from "@kobalte/core";
import { cookieStorage, makePersisted } from "@solid-primitives/storage";
import { useAction, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { type WarehouseInfo } from "@warehouseoetzidev/core/src/entities/warehouses";
import LayoutGrid from "lucide-solid/icons/layout-grid";
import Map from "lucide-solid/icons/map";
import PackagePlus from "lucide-solid/icons/package-plus";
import ZoomReset from "lucide-solid/icons/redo";
import Settings from "lucide-solid/icons/settings";
import Share from "lucide-solid/icons/share";
import ZoomIn from "lucide-solid/icons/zoom-in";
import ZoomOut from "lucide-solid/icons/zoom-out";
import { createEffect, createResource, createSignal, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { toast } from "solid-sonner";
import { useUser } from "./providers/User";
import { Button } from "./ui/button";

const WarehouseSettingsForm = clientOnly(() => import("@/components/forms/warehouse-settings"));

type WarehouseMapProps = {
  warehouses: WarehouseInfo[];
};

export default function WarehouseMap(props: WarehouseMapProps) {
  const user = useUser();
  let canvasRef: HTMLCanvasElement | undefined;

  const [viewState, setViewState, initView] = makePersisted(
    createStore({
      isMapView: true,
    }),
    {
      name: "warehouse-view",
      storage: cookieStorage,
    },
  );

  // Initialize persistent storage
  createResource(() => initView)[0]();

  const [settingsOpen, setSettingsOpen] = createSignal(false);

  const [zoom, setZoom] = createSignal(1);

  const dottedColor = useColorModeValue("#bbbbbb", "#333333");
  const borderColor = useColorModeValue("#b5b5b5", "#444444");
  const warehouseColor = useColorModeValue("#ffffff", "#222222");

  // Add function to handle DPI scaling
  const setupCanvas = (canvas: HTMLCanvasElement) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set display size
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    // Set actual size in memory
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale context to match DPI
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr * zoom(), dpr * zoom());
    }
    return ctx;
  };

  const drawDottedBackground = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    config: {
      dottedColor: string;
    },
  ) => {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width / zoom(), canvas.height / zoom());

    // Set up dot style
    ctx.fillStyle = config.dottedColor;

    // Convert 5mm to pixels (assuming 96 DPI)
    const spacing = (5 * 96) / 25.4; // 5mm in pixels

    // Draw dots
    for (let x = spacing; x < canvas.width / zoom(); x += spacing) {
      for (let y = spacing; y < canvas.height / zoom(); y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1 / zoom(), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawWarehouseMapLayer = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    config: {
      backgroundColor: string;
      borderColor: string;
      warehouse: WarehouseInfo;
    },
  ) => {
    const warehouse = config.warehouse;
    if (!warehouse.dimensions) return;

    const { width, height } = warehouse.dimensions;
    const cornerRadius = 4; // Adjust this value to change the roundness

    // Calculate center position (using style dimensions for proper positioning)
    const rect = canvas.getBoundingClientRect();
    const centerX = (rect.width / zoom() - width) / 2;
    const centerY = (rect.height / zoom() - height) / 2;

    // Draw rounded rectangle path
    ctx.beginPath();
    ctx.moveTo(centerX + cornerRadius, centerY);
    ctx.lineTo(centerX + width - cornerRadius, centerY);
    ctx.arcTo(centerX + width, centerY, centerX + width, centerY + cornerRadius, cornerRadius);
    ctx.lineTo(centerX + width, centerY + height - cornerRadius);
    ctx.arcTo(centerX + width, centerY + height, centerX + width - cornerRadius, centerY + height, cornerRadius);
    ctx.lineTo(centerX + cornerRadius, centerY + height);
    ctx.arcTo(centerX, centerY + height, centerX, centerY + height - cornerRadius, cornerRadius);
    ctx.lineTo(centerX, centerY + cornerRadius);
    ctx.arcTo(centerX, centerY, centerX + cornerRadius, centerY, cornerRadius);
    ctx.closePath();

    // Fill and stroke the same path
    ctx.fillStyle = config.backgroundColor;
    ctx.fill();
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  onMount(() => {
    const canvas = canvasRef;
    if (!canvas) return;

    const ctx = setupCanvas(canvas);
    if (!ctx) return;

    const redraw = () => {
      const rect = canvas.getBoundingClientRect();
      setupCanvas(canvas);
      drawDottedBackground(ctx, canvas, { dottedColor: dottedColor() });
      const warehouse = user.currentWarehouse();
      if (warehouse) {
        drawWarehouseMapLayer(ctx, canvas, {
          backgroundColor: warehouseColor(),
          borderColor: borderColor(),
          warehouse,
        });
      }
    };

    redraw();

    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(canvas);

    onCleanup(() => {
      resizeObserver.disconnect();
    });
  });

  const [dims, setDimensions] = createStore<Omit<NonNullable<Parameters<typeof changeWarehouseDimensions>[0]>, "id">>({
    width: 0,
    height: 0,
  });

  const changeWarehouseDimensionsAction = useAction(changeWarehouseDimensions);
  const isChangingWarehouseDimensions = useSubmission(changeWarehouseDimensions);

  createEffect(() => {
    const canvas = canvasRef;
    if (!canvas) return;

    const visible = viewState.isMapView;
    if (!visible) return;

    const ctx = setupCanvas(canvas);
    if (!ctx) return;

    const redraw = () => {
      const rect = canvas.getBoundingClientRect();
      setupCanvas(canvas);
      drawDottedBackground(ctx, canvas, { dottedColor: dottedColor() });
      const warehouse = user.currentWarehouse();
      if (warehouse) {
        drawWarehouseMapLayer(ctx, canvas, {
          backgroundColor: warehouseColor(),
          borderColor: borderColor(),
          warehouse,
        });
      }
    };

    redraw();
  });

  return (
    <div class="w-full h-full relative">
      <Show when={viewState.isMapView}>
        <canvas id="map" class="w-full h-full absolute top-0 left-0" ref={canvasRef!} />
      </Show>
      {/* Add view toggle button */}
      <div class="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          class="size-8 p-1"
          onClick={() => setViewState({ isMapView: !viewState.isMapView })}
        >
          <Show when={viewState.isMapView} fallback={<Map class="size-4" />}>
            <LayoutGrid class="size-4" />
          </Show>
        </Button>
        <Button
          variant="secondary"
          size="icon"
          class="size-8 p-1"
          onClick={() => {
            setZoom((z) => Math.min(z + 0.1, 3));
            const canvas = canvasRef;
            if (!canvas) return;
            const ctx = setupCanvas(canvas);
            if (!ctx) return;
            drawDottedBackground(ctx, canvas, { dottedColor: dottedColor() });
            const warehouse = user.currentWarehouse();
            if (warehouse) {
              drawWarehouseMapLayer(ctx, canvas, {
                backgroundColor: warehouseColor(),
                borderColor: borderColor(),
                warehouse,
              });
            }
          }}
        >
          <ZoomIn class="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          class="size-8 p-1"
          onClick={() => {
            setZoom((z) => Math.max(z - 0.1, 0.5));
            const canvas = canvasRef;
            if (!canvas) return;
            const ctx = setupCanvas(canvas);
            if (!ctx) return;
            drawDottedBackground(ctx, canvas, { dottedColor: dottedColor() });
            const warehouse = user.currentWarehouse();
            if (warehouse) {
              drawWarehouseMapLayer(ctx, canvas, {
                backgroundColor: warehouseColor(),
                borderColor: borderColor(),
                warehouse,
              });
            }
          }}
        >
          <ZoomOut class="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          class="size-8 p-1"
          onClick={() => {
            // reset zoom to 1
            setZoom(1);
            const canvas = canvasRef;
            if (!canvas) return;
            const ctx = setupCanvas(canvas);
            if (!ctx) return;
            drawDottedBackground(ctx, canvas, { dottedColor: dottedColor() });
            const warehouse = user.currentWarehouse();
            if (warehouse) {
              drawWarehouseMapLayer(ctx, canvas, {
                backgroundColor: warehouseColor(),
                borderColor: borderColor(),
                warehouse,
              });
            }
          }}
        >
          <ZoomReset class="size-4" />
        </Button>
      </div>
      <Show when={user.currentWarehouse() && user.currentWarehouse()!.dimensions === null}>
        {(dimensions) => (
          <Dialog defaultOpen={true}>
            <DialogTrigger class="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]" as={Button}>
              Configure Map Dimensions
            </DialogTrigger>
            <DialogContent class="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Warehouse is missing dimensions!</DialogTitle>
                <DialogDescription>
                  Please add dimensions to your warehouse to be able to edit the map.
                </DialogDescription>
              </DialogHeader>
              <div class="grid gap-4 py-4">
                <NumberField
                  class="w-full"
                  defaultValue={0}
                  value={dims.width}
                  onRawValueChange={(v) => {
                    if (Number.isNaN(v)) {
                      setDimensions("width", 0);
                      return;
                    }
                    setDimensions("width", v);
                  }}
                >
                  <NumberFieldLabel>Width</NumberFieldLabel>
                  <NumberFieldGroup>
                    <NumberFieldInput placeholder="Width" />
                    <NumberFieldIncrementTrigger />
                    <NumberFieldDecrementTrigger />
                  </NumberFieldGroup>
                </NumberField>
                <NumberField
                  class="w-full"
                  defaultValue={0}
                  value={dims.height}
                  onRawValueChange={(v) => {
                    if (Number.isNaN(v)) {
                      setDimensions("height", 0);
                      return;
                    }
                    setDimensions("height", v);
                  }}
                >
                  <NumberFieldLabel>Height</NumberFieldLabel>
                  <NumberFieldGroup>
                    <NumberFieldInput placeholder="Height" />
                    <NumberFieldIncrementTrigger />
                    <NumberFieldDecrementTrigger />
                  </NumberFieldGroup>
                </NumberField>
              </div>
              <DialogFooter>
                <Button
                  disabled={isChangingWarehouseDimensions.pending}
                  type="submit"
                  onClick={() => {
                    console.log(user);
                    const id = user.currentWarehouse()?.id;
                    if (!id) {
                      toast.error("Please select a warehouse first.");
                      return;
                    }
                    const d = dims;
                    toast.promise(changeWarehouseDimensionsAction({ ...d, id }), {
                      loading: "Changing warehouse dimensions...",
                      success: "Warehouse dimensions changed successfully.",
                      error: "Error changing warehouse dimensions",
                    });
                  }}
                >
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Show>
      <div class="absolute top-0 right-0 w-max z-10 p-2">
        <div class="flex flex-col bg-background border shadow-lg rounded-lg min-w-[150px] overflow-clip">
          <div class="flex flex-col gap-2 items-start border-b p-2">
            <Show
              when={user.session()}
              fallback={<p class="text-xs leading-none text-muted-foreground">No organization</p>}
            >
              {(sess) => (
                <div class="flex flex-col gap-1">
                  <p class="text-sm leading-none text-muted-foreground">{sess().org?.name ?? "no company"}</p>
                  <p class="text-xs leading-none text-muted-foreground">{sess().wh?.name ?? "no warehouse"}</p>
                </div>
              )}
            </Show>
          </div>
          <div class="flex flex-col gap-0 p-1">
            <div class="flex flex-row gap-2 items-center justify-start hover:bg-muted p-2 cursor-pointer rounded-sm">
              <PackagePlus class="size-4" />
              <span class="text-sm leading-none">Storage</span>
            </div>
            <Dialog open={settingsOpen()} onOpenChange={setSettingsOpen}>
              <DialogTrigger
                as="div"
                // onClick={() => setSettingsOpen(true)}
                class="flex flex-row gap-2 items-center justify-start hover:bg-muted p-2 cursor-pointer rounded-sm"
              >
                <Settings class="size-4" />
                <span class="text-sm leading-none">Settings</span>
              </DialogTrigger>
              <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Warehouse Settings</DialogTitle>
                  <DialogDescription>Configure your warehouse settings.</DialogDescription>
                </DialogHeader>
                <WarehouseSettingsForm
                  onSubmit={() => {
                    setSettingsOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
            <div class="flex flex-row gap-2 items-center justify-start hover:bg-muted p-2 cursor-pointer rounded-sm">
              <Share class="size-4" />
              <span class="text-sm leading-none">Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
