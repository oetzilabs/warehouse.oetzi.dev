import { Skeleton } from "@/components//ui/skeleton";
import { Button } from "@/components/ui/button";
import { getOffers } from "@/lib/api/offers";
import { createDocumentStorage } from "@/lib/api/storages";
import { createAsync, useAction, useSubmission } from "@solidjs/router";
import { For, Show } from "solid-js";
import { toast } from "solid-sonner";

export function StorageOfferSelection(props: { onSelect: () => void }) {
  const offers = createAsync(() => getOffers(), { deferStream: true });
  const createDocumentStorageAction = useAction(createDocumentStorage);
  const isCreatingDocumentStorage = useSubmission(createDocumentStorage);

  return (
    <Show when={offers()} fallback={<Skeleton class="h-24" />}>
      {(data) => (
        <div class="grid grid-cols-2 gap-4">
          <For each={data()} fallback={<div class="w-full flex flex-col gap-2">No offers found</div>}>
            {(offer) => (
              <div class="flex flex-col items-start">
                <span>{offer.name}</span>
                <span class="text-xs text-muted-foreground">{offer.maxSize}GB Storage</span>
                <span class="text-xs text-muted-foreground">{offer.maxQueueSize} Documents for QueueProcessing</span>
                <Button
                  variant="outline"
                  disabled={isCreatingDocumentStorage.pending}
                  onClick={() => {
                    props.onSelect();
                    toast.promise(
                      createDocumentStorageAction({
                        name: "New Storage",
                        offer_id: offer.id,
                      }),
                      {
                        loading: "Creating...",
                        success: "Storage created successfully.",
                        error: "Error creating storage",
                      },
                    );
                  }}
                >
                  <div class="flex flex-col items-start">
                    <span>{offer.name}</span>
                    <span class="text-xs text-muted-foreground">{offer.maxSize}GB Storage</span>
                  </div>
                </Button>
              </div>
            )}
          </For>
        </div>
      )}
    </Show>
  );
}
