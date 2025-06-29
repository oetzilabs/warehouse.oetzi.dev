import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { getProductLabels } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { createAsync, revalidate } from "@solidjs/router";
import { ProductLabelInfo } from "@warehouseoetzidev/core/src/entities/products/labels";
import dayjs from "dayjs";
import Fuse, { IFuseOptions } from "fuse.js";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { useNewProductForm } from "./form";

export const Labels = () => {
  const { form } = useNewProductForm();
  const labels = createAsync(() => getProductLabels(), { deferStream: true });

  const [search, setSearch] = createSignal("");

  const filteredLabels = (set: Omit<ProductLabelInfo, "products">[]) => {
    const term = search();
    if (!term) {
      return set;
    }
    const options: IFuseOptions<Omit<ProductLabelInfo, "products">> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 1,
      keys: ["name", "description"],
    };
    const fuse = new Fuse(set, options);
    return fuse.search(term).map((d) => d.item);
  };

  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="flex flex-col gap-2 col-span-2">
        <h2 class="text-lg font-semibold">Labels</h2>
        <p class="text-muted-foreground text-sm">
          Assign labels to categorize your product. You can select multiple labels.
        </p>
      </div>
      <div class="col-span-3 flex flex-col gap-4">
        <TextField value={search()} onChange={(e) => setSearch(e)} class="w-full max-w-full">
          <TextFieldInput placeholder="Search labels" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <form.Field name="labels" mode="array">
          {(labelsField) => (
            <div class="w-full flex flex-col gap-4">
              <div class="grid gap-4 w-full grid-cols-1 md:grid-cols-2">
                <Suspense>
                  <Show when={labels()}>
                    {(labelsList) => (
                      <For
                        each={filteredLabels(labelsList()).sort((a, b) => {
                          const aHasImage = a.image?.length ?? 0;
                          const bHasImage = b.image?.length ?? 0;
                          const aIsNewer = (a.updatedAt ?? a.createdAt) > (b.updatedAt ?? b.createdAt);
                          return aHasImage > bHasImage ? -1 : aHasImage < bHasImage ? 1 : aIsNewer ? -1 : 1;
                        })}
                        fallback={
                          <div class="col-span-full w-full flex flex-col gap-2 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border">
                            <span class="text-muted-foreground text-sm">
                              There are currently no labels in the system, please contact the administrator.
                            </span>
                            <div class="flex flex-row gap-2 items-center justify-center">
                              <Button
                                size="sm"
                                class="bg-background"
                                variant="outline"
                                onClick={() => {
                                  toast.promise(revalidate(getProductLabels.key), {
                                    loading: "Refreshing labels...",
                                    success: "Labels refreshed",
                                    error: "Failed to refresh labels",
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
                        {(label) => {
                          const idx = () => labelsField().state.value.indexOf(label.id);
                          const isSelected = () => idx() !== -1;
                          return (
                            <div
                              class={cn(
                                "bg-muted-foreground/5 rounded-lg flex flex-col gap-2 border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer overflow-clip w-full h-content",
                                {
                                  "text-white bg-indigo-600 hover:bg-indigo-600": isSelected(),
                                },
                              )}
                              onClick={() => {
                                if (isSelected()) {
                                  labelsField().removeValue(idx());
                                } else {
                                  labelsField().pushValue(label.id);
                                }
                              }}
                            >
                              <Show
                                when={(label.image?.length ?? 0) > 0 && label.image}
                                fallback={<div class="bg-muted-foreground w-full h-32"></div>}
                              >
                                {(i) => <img src={i()} class="border-b w-full h-32 object-cover" />}
                              </Show>
                              <div class="flex flex-col gap-2 p-4 grow">
                                <div class="flex flex-col gap-1">
                                  <span class="text-sm font-medium leading-none">{label.name}</span>
                                  <span
                                    class={cn("text-sm text-muted-foreground ", {
                                      "text-white/70": isSelected(),
                                    })}
                                  >
                                    {label.description ?? "No description available"}
                                  </span>
                                </div>
                                <div class="flex grow"></div>
                                <div class="flex flex-col gap-1">
                                  <span
                                    class={cn("text-xs text-muted-foreground ", {
                                      "text-white/70": isSelected(),
                                    })}
                                  >
                                    {dayjs(label.updatedAt ?? label.createdAt).format("MMM DD, YYYY - h:mm A")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      </For>
                    )}
                  </Show>
                </Suspense>
              </div>
            </div>
          )}
        </form.Field>
      </div>
    </section>
  );
};
