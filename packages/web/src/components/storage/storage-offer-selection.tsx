import { Skeleton } from "@/components//ui/skeleton";
import { useUser } from "@/components/providers/User";
import { Button } from "@/components/ui/button";
import { createDocumentStorage } from "@/lib/api/document_storages";
import { getOffers } from "@/lib/api/offers";
import { cn } from "@/lib/utils";
import { createAsync, useAction, useSubmission } from "@solidjs/router";
import { For, Show } from "solid-js";
import { toast } from "solid-sonner";

export function StorageOfferSelection(props: { onSelect: () => void }) {
  const user = useUser();
  const offers = createAsync(() => getOffers(), { deferStream: true });
  const createDocumentStorageAction = useAction(createDocumentStorage);
  const isCreatingDocumentStorage = useSubmission(createDocumentStorage);

  return (
    <Show when={offers()} fallback={<Skeleton class="h-24" />}>
      {(data) => (
        <div class="flex flex-col gap-2">
          <For each={data()} fallback={<div class="w-full flex flex-col gap-2">No offers found</div>}>
            {(offer) => (
              <div
                class={cn("flex flex-col items-start border p-4 rounded-lg bg-muted/10  gap-4", {
                  "hover:bg-muted/80": !offer.disabled,
                  "opacity-50": offer.disabled,
                })}
              >
                <div class="flex flex-col items-start gap-2">
                  <span class="text-lg font-semibold">{offer.name}</span>
                  <div class="flex flex-col gap-1">
                    <span class="text-xs text-muted-foreground">
                      Space: {offer.maxSize / 1024 / 1024 / 1024}GB Storage
                    </span>
                    <span class="text-xs text-muted-foreground">QueueProcessing: {offer.maxQueueSize} Documents</span>
                  </div>
                </div>
                <Button
                  disabled={
                    isCreatingDocumentStorage.pending ||
                    offer.disabled ||
                    (user.user()?.payment_methods.length === 0 && offer.requiresPaymentMethod)
                  }
                  class="w-full"
                  onClick={() => {
                    props.onSelect();
                    toast.promise(
                      createDocumentStorageAction({
                        name: `${offer.name} Storage`,
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
                  Use
                </Button>
              </div>
            )}
          </For>
        </div>
      )}
    </Show>
  );
}
