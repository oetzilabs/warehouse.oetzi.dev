import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
import { useUser } from "@/components/providers/User";
import { StorageOfferSelection } from "@/components/storage/storage-offer-selection";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress, ProgressLabel, ProgressValueLabel } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createDocumentStorage, getDocumentStorage } from "@/lib/api/document_storages";
import { getSalesLastFewMonths } from "@/lib/api/sales";
import { getStorages } from "@/lib/api/storages";
import { changeWarehouse } from "@/lib/api/warehouses";
import { A, createAsync, revalidate, useAction, useSubmission } from "@solidjs/router";
import Check from "lucide-solid/icons/check";
import ChevronDown from "lucide-solid/icons/chevron-down";
import Loader2 from "lucide-solid/icons/loader-2";
import Minus from "lucide-solid/icons/minus";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createEffect, createMemo, createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export default function DashboardPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  setBreadcrumbs([
    {
      label: "Dashboard",
      href: "/dashboard",
    },
  ]);

  const user = useUser();

  const documentStorage = createAsync(() => getDocumentStorage(), { deferStream: true });
  const inventories = createAsync(() => getStorages(), { deferStream: true });
  const salesLastFewMonths = createAsync(() => getSalesLastFewMonths(), { deferStream: true });

  const changeWarehouseAction = useAction(changeWarehouse);
  const isChangingWarehouse = useSubmission(changeWarehouse);

  const [isOpen, setIsOpen] = createSignal(false);

  const kbToGb = (kb: number) => kb / 1024 / 1024;

  let leftPanelRef: HTMLDivElement | undefined;

  const [leftPanelHeight, setLeftPanelHeight] = createSignal(110);

  createEffect(() => {
    if (!leftPanelRef) {
      return;
    }
    setLeftPanelHeight(leftPanelRef.clientHeight);
  });

  const [zoomLevel, setZoomLevel] = createSignal(1);

  const overallBoundingBox = (areas: any[]) => {
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
  };

  return (
    <div class="flex flex-col container py-4">
      <div class="flex flex-col gap-4">
        <h1 class="text-2xl font-semibold">Dashboard</h1>
        <div class="flex flex-col gap-4">
          <div class="flex flex-row gap-4 w-full items-center justify-between">
            <div class="flex flex-col gap-4 w-full" ref={leftPanelRef!}>
              <div class="flex flex-row gap-4 w-full items-start h-content">
                <Suspense fallback={<Skeleton class="w-full h-full" />}>
                  <Show when={documentStorage()}>
                    {(storages) => (
                      <For
                        each={storages()}
                        fallback={
                          <div class="flex flex-col gap-4 w-full border rounded-md p-4">
                            <div class="text-center text-xs text-muted-foreground">No document storages found</div>
                            <div class="flex justify-center">
                              <Dialog open={isOpen()} onOpenChange={setIsOpen}>
                                <DialogTrigger as={Button} size="sm" type="button" class="h-8 px-2 w-max">
                                  <Plus class="size-4" />
                                  Create Document Storage
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Choose a Storage Offer</DialogTitle>
                                    <DialogDescription>
                                      Choose a storage offer to create a new document storage
                                    </DialogDescription>
                                  </DialogHeader>
                                  <StorageOfferSelection onSelect={() => setIsOpen(false)} />
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        }
                      >
                        {(storage) => (
                          <div class="flex flex-row gap-4 w-full">
                            <Progress
                              value={kbToGb(storage.documents.map((d) => d.size).reduce((a, b) => a + b, 0))}
                              minValue={0}
                              maxValue={kbToGb(storage.offer.maxSize)}
                              getValueLabel={({ value, max, min }) => `${value} of ${max} GB`}
                              class="space-y-4 border p-4 rounded-lg w-full"
                            >
                              <div class="flex justify-between">
                                <ProgressLabel>{String(storage.documents.length)} documents</ProgressLabel>
                                <ProgressValueLabel />
                              </div>
                            </Progress>
                            <Progress
                              value={storage.queuedDocuments.length}
                              minValue={0}
                              maxValue={storage.offer.maxQueueSize}
                              getValueLabel={({ value, max, min }) => `${value} of ${max}`}
                              class="space-y-4 border p-4 rounded-lg  w-full"
                            >
                              <div class="flex justify-between">
                                <ProgressLabel>{String(storage.documents.length)} queued documents</ProgressLabel>
                                <ProgressValueLabel />
                              </div>
                            </Progress>
                          </div>
                        )}
                      </For>
                    )}
                  </Show>
                </Suspense>
              </div>
              <div class="flex flex-row gap-4 w-full items-start h-full">
                <Suspense fallback={<Skeleton class="w-full h-full" />}>
                  <Show
                    when={inventories() && inventories()!.length > 0 && inventories()}
                    fallback={
                      <div class="flex flex-col gap-4 w-full bg-muted/50 rounded-lg border p-4 items-center justify-center">
                        <span class="text-sm text-muted-foreground">You have no inventory spaces</span>
                        <div class="flex flex-row gap-2 items-center">
                          <Button size="sm" class="h-8 pl-2 w-max drop-shadow-sm">
                            <Plus class="size-4" />
                            Add Storage Zone
                          </Button>
                          <Button
                            size="sm"
                            class="h-8 pl-2 w-max bg-background drop-shadow-sm"
                            variant="outline"
                            onClick={() => {
                              toast.promise(revalidate(getStorages.key), {
                                loading: "Refreshing storages...",
                                success: "Storages refreshed",
                                error: "Failed to refresh storages",
                              });
                            }}
                          >
                            <RotateCw class="size-4" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    {(spaces) => (
                      <div class="flex flex-row gap-4 w-full">
                        <Progress
                          value={spaces()
                            .map((d) => d.currentOccupancy ?? 0)
                            .reduce((a, b) => a + b, 0)}
                          minValue={0}
                          maxValue={spaces()
                            .map((d) => d.capacity)
                            .reduce((a, b) => a + b, 0)}
                          getValueLabel={({ value, max, min }) => `${value} of ${max} Inventory Spaces`}
                          class="space-y-4 border p-4 rounded-lg w-full"
                        >
                          <div class="flex justify-between">
                            <ProgressLabel>{String(spaces().length)} Inventory Spaces</ProgressLabel>
                            <ProgressValueLabel />
                          </div>
                        </Progress>
                      </div>
                    )}
                  </Show>
                </Suspense>
              </div>
            </div>
            <div class="w-full h-full flex flex-col gap-2">
              <div class="flex flex-col gap-2 w-full h-full">
                <Suspense fallback={<Skeleton class="w-full h-full" />}>
                  <Show
                    when={
                      salesLastFewMonths() &&
                      (salesLastFewMonths()
                        ?.datasets.map((d) => d.data.length)
                        .reduce((a, b) => a + b, 0) ?? 0) > 0 &&
                      salesLastFewMonths()
                    }
                    fallback={
                      <div class="w-full p-4 border rounded-lg h-full bg-muted/50 flex items-center justify-center flex-col gap-2">
                        <span class="text-sm text-muted-foreground">No sales data found</span>
                        <div class="flex flex-row gap-2 items-center">
                          <Button
                            size="sm"
                            variant="outline"
                            class="h-8 pl-2 w-max bg-background drop-shadow-sm"
                            onClick={() => {
                              toast.promise(revalidate(getSalesLastFewMonths.key), {
                                loading: "Refreshing sales data...",
                                success: "Sales data refreshed",
                                error: "Failed to refresh sales data",
                              });
                            }}
                          >
                            <RotateCw class="size-4" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    {(sales) => (
                      <div class="w-full p-4 border rounded-lg h-full">
                        <LineChart
                          data={sales()}
                          options={{
                            maintainAspectRatio: true,
                            responsive: false,
                            scales: {
                              x: {
                                display: false,
                              },
                              y: {
                                display: false,
                              },
                            },
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                          }}
                          height={leftPanelHeight() - 10}
                        />
                      </div>
                    )}
                  </Show>
                </Suspense>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-4 border rounded-lg p-4">
            <Show when={user.currentWarehouse()}>
              {(warehouse) => (
                <div class="flex flex-col gap-4">
                  <div class="flex flex-row gap-4 items-center justify-between">
                    <span class="font-semibold">{warehouse().name}</span>
                    <div class="w-max">
                      <DropdownMenu>
                        <DropdownMenuTrigger as={Button} size="sm" class="h-8 pr-2 w-max">
                          Warehouses
                          <ChevronDown class="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Manage Warehouse</DropdownMenuLabel>
                            <For
                              each={user.user()!.whs.map((w) => w.warehouse)}
                              fallback={<DropdownMenuItem disabled>No warehouses</DropdownMenuItem>}
                            >
                              {(wh) => (
                                <DropdownMenuItem
                                  disabled={wh.id === warehouse().id}
                                  onSelect={() => {
                                    toast.promise(changeWarehouseAction(wh.id), {
                                      loading: "Changing warehouse...",
                                      success: "Warehouse changed",
                                      error: "Failed to change warehouse",
                                    });
                                  }}
                                >
                                  <Show when={wh.id === warehouse().id}>
                                    <Check class="size-4" />
                                  </Show>
                                  {wh.name}
                                </DropdownMenuItem>
                              )}
                            </For>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem as={A} href="/warehouses/new">
                              <Plus class="size-4" />
                              Create Warehouse
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div class="rounded-md w-full aspect-video bg-muted/50 border relative overflow-clip">
                    <div class="flex items-center justify-center w-full h-full relative">
                      <Show when={overallBoundingBox(warehouse().areas)}>
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
                            <For each={warehouse().areas}>
                              {(area) => (
                                <Popover
                                  placement={
                                    bb().x + bb().width / 2 > area.bounding_box.x + area.bounding_box.width / 2
                                      ? "right-end"
                                      : "left-start"
                                  }
                                >
                                  <PopoverTrigger
                                    as="div"
                                    class="absolute border bg-background rounded drop-shadow-sm"
                                    style={{
                                      top: `${area.bounding_box.y - bb().y}px`,
                                      left: `${area.bounding_box.x - bb().x}px`,
                                      width: `${area.bounding_box.width}px`,
                                      height: `${area.bounding_box.height}px`,
                                    }}
                                  />
                                  <PopoverContent>
                                    {/*Here will be information about the area, meaning the storages and inventory spaces*/}
                                  </PopoverContent>
                                </Popover>
                              )}
                            </For>
                          </div>
                        )}
                      </Show>
                    </div>
                    <div class="absolute right-0 bottom-0 p-3">
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
                </div>
              )}
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
