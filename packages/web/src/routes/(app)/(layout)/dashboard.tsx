import { useSidebarContent } from "@/components/providers/SidebarContentProvider";
import { useUser } from "@/components/providers/User";
import { StorageDataTable } from "@/components/storage/storage-data-table";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress, ProgressLabel, ProgressValueLabel } from "@/components/ui/progress";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getDocumentStorage } from "@/lib/api/document_storages";
import { changeFacility } from "@/lib/api/facilities";
import { getInventory } from "@/lib/api/inventory";
import { getSalesLastFewMonths } from "@/lib/api/sales";
import { changeWarehouse } from "@/lib/api/warehouses";
import { A, createAsync, revalidate, useAction, useSubmission } from "@solidjs/router";
import Check from "lucide-solid/icons/check";
import ChevronDown from "lucide-solid/icons/chevron-down";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Warehouse from "lucide-solid/icons/warehouse";
import { createEffect, createSignal, For, onCleanup, onMount, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export default function DashboardPage() {
  const user = useUser();
  const { setContent } = useSidebarContent();
  // setContent(<div>Hello</div>);
  onCleanup(() => {
    setContent(null);
  });
  const documentStorage = createAsync(() => getDocumentStorage(), { deferStream: true });
  const inventory = createAsync(() => getInventory(), { deferStream: true });
  const salesLastFewMonths = createAsync(() => getSalesLastFewMonths(), { deferStream: true });

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

  return (
    <div class="flex flex-col w-full">
      <div class="flex flex-col gap-4 w-full py-4 border-b">
        <div class="w-full flex flex-row items-center justify-between px-4">
          <Show when={user.currentWarehouse()}>
            {(warehouse) => (
              <div class="flex flex-col gap-4 w-full">
                <div class="flex flex-row gap-4 items-center justify-between">
                  <div class="flex flex-row items-baseline gap-2">
                    <span class="text-3xl font-semibold">{warehouse().name}</span>
                    <span class="text-muted-foreground font-medium">{user.currentFacility()?.name ?? ""}</span>
                  </div>
                  <div class="w-max">
                    <DropdownMenu>
                      <DropdownMenuTrigger as={Button} size="sm" class="h-8 pr-2 w-max">
                        Facilities
                        <ChevronDown class="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <For
                          each={warehouse().fcs}
                          fallback={<DropdownMenuItem disabled>No facilities</DropdownMenuItem>}
                        >
                          {(fc) => (
                            <DropdownMenuItem
                              disabled={fc.id === user.currentFacility()?.id}
                              onSelect={() => {
                                // setFacility(fc.id);
                              }}
                            >
                              <Show when={fc.id === user.currentFacility()?.id} fallback={<Warehouse class="size-4" />}>
                                <Check class="size-4" />
                              </Show>
                              {fc.name}
                            </DropdownMenuItem>
                          )}
                        </For>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem as={A} href={`/warehouses/${warehouse().id}/facilities/new`}>
                          <Plus class="size-4" />
                          Add Facility
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )}
          </Show>
        </div>
        <div class="flex flex-col gap-4 ">
          <div class="flex flex-row gap-4 w-full items-center justify-between px-4 pb-4 border-b">
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
                  <Show when={inventory()}>
                    {(storages) => (
                      <div class="flex flex-row gap-4 w-full">
                        <Show
                          when={storages().amounOfAreas > 0 && storages().amounOfStorages > 0}
                          fallback={
                            <div class="flex flex-col gap-4 w-full bg-muted/50 rounded-lg border p-4 items-center justify-center">
                              <Show when={storages().amounOfAreas > 0 && storages().amounOfStorages === 0}>
                                <span class="text-sm text-muted-foreground">
                                  You have storage areas but no spaces set up.
                                </span>
                                <div class="flex flex-row gap-2 items-center">
                                  <Button size="sm" class="h-8 pl-2 w-max drop-shadow-sm" onClick={() => {}}>
                                    <Plus class="size-4" />
                                    Add Storage Zone
                                  </Button>
                                  <Button
                                    size="sm"
                                    class="h-8 pl-2 w-max bg-background drop-shadow-sm"
                                    variant="outline"
                                    onClick={() => {
                                      toast.promise(revalidate(getInventory.key), {
                                        loading: "Refreshing inventory...",
                                        success: "Inventory refreshed",
                                        error: "Failed to refresh inventory",
                                      });
                                    }}
                                  >
                                    <RotateCw class="size-4" />
                                    Refresh
                                  </Button>
                                </div>
                              </Show>
                              <Show when={storages().amounOfAreas === 0}>
                                <span class="text-sm text-muted-foreground">No storage areas found</span>
                                <div class="">
                                  <Button size="sm" class="h-8 pl-2 w-max drop-shadow-sm" onClick={() => {}}>
                                    <Plus class="size-4" />
                                    Add Storage Zone
                                  </Button>
                                  <Button
                                    size="sm"
                                    class="h-8 pl-2 w-max bg-background drop-shadow-sm"
                                    variant="outline"
                                    onClick={() => {
                                      toast.promise(revalidate(getInventory.key), {
                                        loading: "Refreshing inventory...",
                                        success: "Inventory refreshed",
                                        error: "Failed to refresh inventory",
                                      });
                                    }}
                                  >
                                    <RotateCw class="size-4" />
                                    Refresh
                                  </Button>
                                </div>
                              </Show>
                            </div>
                          }
                        >
                          <Progress
                            value={storages().totalCurrentOccupancy}
                            minValue={0}
                            maxValue={storages().totalCapacity}
                            getValueLabel={({ value, max, min }) => `${value} of ${max} Storage Spaces`}
                            class="space-y-4 border p-4 rounded-lg w-full"
                          >
                            <div class="flex justify-between">
                              <ProgressLabel>{String(storages().totalCurrentOccupancy)} Goods</ProgressLabel>
                              <ProgressValueLabel />
                            </div>
                          </Progress>
                        </Show>
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
          <div class="flex flex-col gap-4 px-4 ">
            <Show
              when={user.currentFacility()}
              fallback={
                <div class="w-full h-full flex flex-col">
                  <div class="flex flex-col gap-2 w-full py-4 bg-muted text-muted-foreground items-center text-sm rounded-md border">
                    No facilities selected
                  </div>
                </div>
              }
            >
              {(fc) => (
                <div class="w-full flex flex-col gap-2">
                  <StorageDataTable
                    data={fc()
                      .ars.map((a) => a.strs)
                      .flat()
                      .flat()}
                  />
                </div>
              )}
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
