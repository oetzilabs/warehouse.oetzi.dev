import FacilityImage from "@/components/FacilityImage";
import { FilterPopover } from "@/components/filters/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressValueLabel } from "@/components/ui/progress";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { InventoryInfo } from "@warehouseoetzidev/core/src/entities/inventory";
import { type ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import { type StorageInfo } from "@warehouseoetzidev/core/src/entities/storages";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Package from "lucide-solid/icons/package";
import Plus from "lucide-solid/icons/plus";
import TriangleAlert from "lucide-solid/icons/triangle-alert";
import { Warning } from "postcss";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import FacilityEditor from "../../FacilityEditor";

type InventoryListProps = {
  inventory: Accessor<InventoryInfo>;
};

export const InventoryList = (props: InventoryListProps) => {
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const debouncedSearch = leadingAndTrailing(
    debounce,
    (text: string) => {
      setDSearch(text);
    },
    500,
  );

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
              debouncedSearch(e);
            }}
            class="w-full max-w-full"
          >
            <TextFieldInput placeholder="Search storages..." class="w-full max-w-full rounded-lg px-4" />
          </TextField>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Show
            when={props.inventory().storages.length > 0}
            fallback={<div class="col-span-full p-8 text-center text-muted-foreground">No storages found</div>}
          >
            <For each={props.inventory().storages}>
              {(storage) => (
                <div class="border rounded-lg flex flex-col overflow-hidden bg-card">
                  <div class="flex flex-row items-center justify-between p-4 border-b bg-muted-foreground/5 dark:bg-muted/30">
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
                    <Button
                      size="sm"
                      variant="outline"
                      class="bg-background"
                      as={A}
                      href={`/inventory/storages/${storage.id}`}
                    >
                      View
                      <ArrowUpRight class="size-4 ml-2" />
                    </Button>
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

                  <div class="p-4 flex flex-col gap-2">
                    <div class="flex justify-between items-center">
                      <h5 class="text-sm font-medium">Products</h5>
                      <Badge variant="secondary">{storage.productsCount}</Badge>
                    </div>
                    <Show
                      when={storage.productsCount > 0}
                      fallback={<p class="text-sm text-muted-foreground">No products stored</p>}
                    >
                      <div class="flex flex-col gap-1">
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
                        <Show when={storage.products.length > 3}>
                          <Button variant="ghost" size="sm" as={A} href={`/inventory/storage/${storage.id}`}>
                            View all {summarizeProducts(storage.products).length} products
                          </Button>
                        </Show>
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
