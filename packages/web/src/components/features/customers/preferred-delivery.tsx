import { PreferredTimeDialog } from "@/components/customers/preferred-time-dialog";
import { Button } from "@/components/ui/button";
import { addPreferredDeliveryTime, removePreferredDeliveryTime } from "@/lib/api/customers";
import { useAction, useSubmission } from "@solidjs/router";
import { CustomerInfo } from "@warehouseoetzidev/core/src/entities/customers";
import dayjs from "dayjs";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import X from "lucide-solid/icons/x";
import { Accessor, createSignal, For, Show } from "solid-js";
import { toast } from "solid-sonner";

type PreferredDeliveryProps = {
  customer: Accessor<CustomerInfo>;
};

export const PreferredDelivery = (props: PreferredDeliveryProps) => {
  const [deliveryDialogOpen, setDeliveryDialogOpen] = createSignal(false);

  const addDeliveryTimeAction = useAction(addPreferredDeliveryTime);
  const isAddingDeliveryTime = useSubmission(addPreferredDeliveryTime);

  const removePreferredDeliveryTimeAction = useAction(removePreferredDeliveryTime);
  const isRemovingPreferredDeliveryTime = useSubmission(removePreferredDeliveryTime);
  return (
    <div class="flex flex-col border rounded-lg w-full grow">
      <div class="flex flex-row items-center gap-2 justify-between p-4 py-2 pr-2 border-b">
        <h2 class="font-medium">Preferred Delivery Times</h2>
        <div class="flex flex-row items-center">
          <Button size="sm" onClick={() => setDeliveryDialogOpen(true)}>
            <Plus class="size-4" />
            Add Time
          </Button>
          <PreferredTimeDialog
            open={deliveryDialogOpen()}
            onOpenChange={setDeliveryDialogOpen}
            title="Add Preferred Delivery Time"
            description="Set the preferred time for delivery"
            onSubmit={async (data) => {
              const promise = addDeliveryTimeAction({ ...data, customerId: props.customer().id });
              toast.promise(promise, {
                loading: "Adding delivery time...",
                success: "Delivery time added",
                error: "Failed to add delivery time",
              });
            }}
          />
        </div>
      </div>
      <div class="flex flex-col w-full grow">
        <Show when={props.customer().pdt.length === 0}>
          <div class="flex flex-col gap-4 items-center justify-center p-10 col-span-full bg-muted-foreground/5 grow">
            <span class="text-sm text-muted-foreground">No delivery times have been added</span>
          </div>
        </Show>
        <Show when={props.customer().pdt.length > 0}>
          <div class="flex flex-col gap-0 grow">
            <For
              each={props
                .customer()
                .pdt.sort((a, b) => dayjs(a.startTime).isoWeekday() - dayjs(b.startTime).isoWeekday())}
            >
              {(t) => (
                <div class="flex flex-row gap-2 items-center justify-between border-b last:border-b-0 p-4">
                  {/* <span class="text-sm text-muted-foreground">{o.products.length}</span> */}
                  <div class="flex flex-col gap-2">
                    <span class="text-sm text-muted-foreground">{dayjs(t.startTime).format("dddd")}</span>
                    <Show when={t.notes}>{(note) => <span class="text-sm text-muted-foreground">{note()}</span>}</Show>
                  </div>
                  <div class="flex flex-row items-center gap-2 place-self-start">
                    <span class="text-sm text-muted-foreground">
                      {dayjs(t.startTime).format("HH:mm")} - {dayjs(t.endTime).format("HH:mm")}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      class="bg-background size-6"
                      onClick={() => {
                        toast.promise(removePreferredDeliveryTimeAction(t.id), {
                          loading: "Removing delivery time...",
                          success: "Delivery time removed",
                          error: "Failed to remove delivery time",
                        });
                      }}
                    >
                      <Show
                        when={
                          isRemovingPreferredDeliveryTime.pending && isRemovingPreferredDeliveryTime.input[0] === t.id
                        }
                        fallback={<X class="size-3" />}
                      >
                        <Loader2 class="size-3 animate-spin" />
                      </Show>
                    </Button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};
