import { Button } from "@/components/ui/button";
import { getStorageConditions } from "@/lib/api/storage_conditions";
import { cn } from "@/lib/utils";
import { createAsync, revalidate } from "@solidjs/router";
import dayjs from "dayjs";
import RotateCw from "lucide-solid/icons/rotate-cw";
import TextSelect from "lucide-solid/icons/text-select";
import { For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { useNewProductForm } from "./form";

export const Conditions = () => {
  const form = useNewProductForm();
  const conditions = createAsync(() => getStorageConditions(), { deferStream: true });
  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="flex flex-col gap-2 col-span-2">
        <h2 class="text-lg font-semibold">Storage Conditions</h2>
        <p class="text-muted-foreground text-sm">Specify the storage conditions required for this product.</p>
      </div>
      <div class="col-span-3">
        <form.Field name="conditions" mode="array">
          {(conditionsField) => (
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              <Suspense>
                <Show when={conditions()}>
                  {(conditionsList) => (
                    <For
                      each={conditionsList()}
                      fallback={
                        <div class="col-span-full w-full flex flex-col gap-2 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border">
                          <span class="text-muted-foreground text-sm">
                            There are currently no conditions in the system, please contact the administrator.
                          </span>
                          <div class="flex flex-row gap-2 items-center justify-center">
                            <Button
                              size="sm"
                              class="bg-background"
                              variant="outline"
                              onClick={() => {
                                toast.promise(revalidate(getStorageConditions.key), {
                                  loading: "Refreshing storage conditions...",
                                  success: "Storage conditions refreshed",
                                  error: "Failed to refresh storage conditions",
                                });
                              }}
                            >
                              <RotateCw class="size-4" />
                              Refresh
                            </Button>
                            <Button size="sm" onClick={() => {}}>
                              <TextSelect class="size-4" />
                              Derive from Labels
                            </Button>
                          </div>
                        </div>
                      }
                    >
                      {(condition) => {
                        const idx = () => conditionsField().state.value.indexOf(condition.id);
                        const isSelected = () => idx() !== -1;
                        return (
                          <div
                            class={cn(
                              "bg-muted-foreground/5 rounded-lg p-4 flex flex-col gap-2 items-center justify-center border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer",
                              {
                                "text-white bg-indigo-600 hover:bg-indigo-600": isSelected(),
                              },
                            )}
                            onClick={() => {
                              if (isSelected()) {
                                conditionsField().removeValue(idx());
                              } else {
                                conditionsField().pushValue(condition.id);
                              }
                            }}
                          >
                            <span class="text-sm font-medium">{condition.name}</span>
                            <span
                              class={cn("text-sm text-muted-foreground text-center", {
                                "text-white/70": isSelected(),
                              })}
                            >
                              {condition.description ?? "No description available"}
                            </span>
                            <span
                              class={cn("text-xs text-muted-foreground text-center", {
                                "text-white/70": isSelected(),
                              })}
                            >
                              {dayjs(condition.updatedAt ?? condition.createdAt).format("MMM DD, YYYY - h:mm A")}
                            </span>
                          </div>
                        );
                      }}
                    </For>
                  )}
                </Show>
              </Suspense>
            </div>
          )}
        </form.Field>
      </div>
    </section>
  );
};
