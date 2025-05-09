import { useBreadcrumbs } from "@/components/providers/Breadcrumbs";
import { StorageOfferSelection } from "@/components/storage/storage-offer-selection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress, ProgressLabel, ProgressValueLabel } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createDocumentStorage, getDocumentStorage } from "@/lib/api/storages";
import { createAsync, useAction, useSubmission } from "@solidjs/router";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import { createSignal, For, Show, Suspense } from "solid-js";
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

  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <div class="flex flex-col container py-2">
      <div class="flex flex-col gap-2">
        <h1 class="text-2xl font-medium">Dashboard</h1>
        <div class="flex flex-col gap-2">
          <Suspense fallback={<Skeleton class="w-full h-full" />}>
            <Show when={documentStorage()}>
              {(storages) => (
                <div class="w-full h-content border rounded-lg p-4 flex flex-col gap-2">
                  <Show when={storages().length > 0}>
                    <div class="font-semibold">Document Storages</div>
                  </Show>
                  <div class="w-full">
                    <For
                      each={storages()}
                      fallback={
                        <div class="flex flex-col gap-2">
                          <div class="text-center text-sm text-muted-foreground">No document storages found</div>
                          <div class="flex justify-center">
                            <Dialog open={isOpen()} onOpenChange={setIsOpen}>
                              <DialogTrigger as={Button} size="sm" type="button">
                                <Plus class="size-4" />
                                Create Storage
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Create Storage</DialogTitle>
                                </DialogHeader>
                                <StorageOfferSelection onSelect={() => setIsOpen(false)} />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      }
                    >
                      {(storage) => (
                        <div class="grid grid-cols-2 gap-2 w-full">
                          <Progress
                            value={storage.documents.map((d) => d.size).reduce((a, b) => a + b, 0)}
                            minValue={0}
                            maxValue={storage.offer.maxSize}
                            getValueLabel={({ value, max, min }) => `${value} of ${max} GB`}
                            class="space-y-2 border p-4 rounded-md"
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
                            getValueLabel={({ value, max, min }) => `${value} of ${max} Documents`}
                            class="space-y-2 border p-4 rounded-md"
                          >
                            <div class="flex justify-between">
                              <ProgressLabel>{String(storage.documents.length)} documents in Queue</ProgressLabel>
                              <ProgressValueLabel />
                            </div>
                          </Progress>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </Show>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
