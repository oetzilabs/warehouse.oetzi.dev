import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressValueLabel } from "@/components/ui/progress";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type StorageStatisticsInfo } from "@warehouseoetzidev/core/src/entities/inventory";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Package from "lucide-solid/icons/package";
import { Accessor, createSignal, For, Show } from "solid-js";

type StorageStatisticsListProps = {
  storages: Accessor<StorageStatisticsInfo>;
};

export const StorageStatisticsList = (props: StorageStatisticsListProps) => {
  const [search, setSearch] = createSignal("");

  const summarizeProducts = (products: any[]) => {
    const summary = new Map<string, number>();
    products.forEach((p) => {
      const name = p.product.name;
      summary.set(name, (summary.get(name) || 0) + 1);
    });
    return Array.from(summary.entries());
  };

  return (
    <div class="w-full flex flex-col gap-4">
      <div class="flex flex-col gap-4">
        <div class="flex flex-row items-center justify-between gap-4">
          <TextField
            value={search()}
            onChange={(e) => {
              setSearch(e);
            }}
            class="w-full max-w-full"
          >
            <TextFieldInput placeholder="Search storages..." class="w-full max-w-full rounded-lg px-4" />
          </TextField>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Show
            when={props.storages().storages.length > 0}
            fallback={<div class="col-span-full p-8 text-center text-muted-foreground">No storages found</div>}
          >
            <For each={props.storages().storages}>
              {(storage) => (
                <div class="border rounded-lg flex flex-col overflow-hidden bg-card">
                  <div class="flex flex-row items-center justify-between p-4 border-b bg-muted-foreground/10 dark:bg-muted/30">
                    <div class="flex flex-col gap-1">
                      <Show when={storage.parent} fallback={<h4 class="font-medium">{storage.name}</h4>}>
                        {(parent) => (
                          <h4 class="font-medium">
                            {storage.name} via {parent().name}
                          </h4>
                        )}
                      </Show>
                      <Show when={storage.description}>
                        <p class="text-sm text-muted-foreground">{storage.description}</p>
                      </Show>
                    </div>
                    <Show when={storage.children.length > 0}>
                      <Button size="sm" variant="outline" as={A} href={`/storages/${storage.id}`}>
                        View
                        <ArrowUpRight class="size-4 ml-2" />
                      </Button>
                    </Show>
                  </div>

                  <div class="p-4 border-b">
                    <div class="flex flex-col gap-2">
                      <div class="flex justify-between text-sm">
                        <span>Capacity</span>
                        <span class="font-['Geist_Mono_Variable']">
                          {storage.productsCount}/{storage.childrenCapacity}
                        </span>
                      </div>
                      <Progress
                        value={storage.productsCount}
                        maxValue={storage.childrenCapacity}
                        color="bg-muted-foreground"
                      >
                        <ProgressValueLabel />
                      </Progress>
                    </div>
                  </div>

                  <div class="p-4 flex flex-col gap-4">
                    <div class="flex justify-between items-center">
                      <h5 class="text-sm font-medium">Products</h5>
                      <Badge variant="secondary">{storage.productsCount}</Badge>
                    </div>
                    <Show
                      when={storage.productsCount > 0}
                      fallback={<p class="text-sm text-muted-foreground">No products stored</p>}
                    >
                      <div class="flex flex-col gap-2">
                        <For each={storage.productSummary}>
                          {(pc) => (
                            <div class="flex items-center gap-2 text-sm">
                              <Package class="size-4 shrink-0" />
                              <span class="truncate font-['Geist_Mono_Variable']">
                                {pc.count}x {pc.product.name}
                              </span>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
};
