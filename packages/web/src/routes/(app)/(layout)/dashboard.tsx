import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
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
import { Progress, ProgressLabel, ProgressValueLabel } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createDocumentStorage, getDocumentStorage } from "@/lib/api/document_storages";
import { getSalesLastFewMonths } from "@/lib/api/sales";
import { getStorages } from "@/lib/api/storages";
import { A, createAsync, useAction, useSubmission } from "@solidjs/router";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
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

  const documentStorage = createAsync(() => getDocumentStorage(), { deferStream: true });
  const inventories = createAsync(() => getStorages(), { deferStream: true });
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
    <div class="flex flex-col container py-4">
      <div class="flex flex-col gap-4">
        <h1 class="text-2xl font-semibold">Dashboard</h1>
        <div class="flex flex-col gap-2">
          <div class="flex flex-row gap-2 w-full items-center justify-between">
            <div class="flex flex-col gap-2 w-full" ref={leftPanelRef!}>
              <div class="flex flex-row gap-2 w-full items-start h-content">
                <Suspense fallback={<Skeleton class="w-full h-full" />}>
                  <Show when={documentStorage()}>
                    {(storages) => (
                      <For
                        each={storages()}
                        fallback={
                          <div class="flex flex-col gap-2 w-full border rounded-md p-4">
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
                          <div class="flex flex-row gap-2 w-full">
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
              <div class="flex flex-row gap-2 w-full items-start h-full">
                <Suspense fallback={<Skeleton class="w-full h-full" />}>
                  <Show
                    when={inventories() && inventories()!.length > 0 && inventories()}
                    fallback={
                      <div class="flex flex-col gap-2 w-full bg-muted/10 rounded-lg border p-4 items-center justify-center">
                        <span class="text-xs text-muted-foreground">You have no inventory spaces</span>
                        <div class="flex flex-row gap-1 items-center">
                          <Button size="sm" class="h-8">
                            Create Space
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    {(spaces) => (
                      <div class="flex flex-row gap-2 w-full">
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
                      <div class="w-full p-4 border rounded-lg h-full bg-muted flex items-center justify-center">
                        <span class="text-xs text-muted-foreground">No sales data found</span>
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
        </div>
      </div>
    </div>
  );
}
