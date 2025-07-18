import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressValueLabel } from "@/components/ui/progress";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { A } from "@solidjs/router";
import { InventoryInfo } from "@warehouseoetzidev/core/src/entities/inventory";
import Fuse, { IFuseOptions } from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Package from "lucide-solid/icons/package";
import Plus from "lucide-solid/icons/plus";
import { Accessor, createMemo, createSignal, For, Show } from "solid-js";

type InventoryListProps = {
  inventory: Accessor<InventoryInfo>;
};

export const InventoryList = (props: InventoryListProps) => {
  const [search, setSearch] = createSignal("");

  const summarizeProducts = (products: any[]) => {
    const summary = new Map<string, number>();
    products.forEach((p) => {
      const name = p.product.name;
      summary.set(name, (summary.get(name) || 0) + 1);
    });
    return Array.from(summary.entries());
  };

  const filteredData = createMemo(() => {
    const term = search();
    const set = props.inventory().storages;
    if (!term) {
      return set;
    }
    const options: IFuseOptions<InventoryInfo["storages"][number]> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 1,
      keys: ["name", "description", "productSummary.product.name", "productSummary.product.sku"],
    };
    const fuse = new Fuse(set, options);
    return fuse.search(term).map((d) => d.item);
  });

  return (
    <div class="w-full flex flex-col gap-0 relative pb-2">
      <div class="flex flex-col gap-4">
        <Show when={props.inventory().storages.length > 0}>
          <div class="flex flex-row items-center justify-between gap-0 w-full bg-background">
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
        </Show>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <For
            each={filteredData()}
            fallback={
              <div class="col-span-full p-10 text-center flex flex-col items-center justify-center gap-4 bg-muted-foreground/[0.025] dark:bg-muted/15 border rounded-lg overflow-clip">
                <span class="text-muted-foreground select-none text-sm ">You have no storages yet.</span>
                <Button size="sm" as={A} href="/storages/new" class="w-max">
                  <Plus class="size-4" />
                  Add Storage
                </Button>
              </div>
            }
          >
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
                  <Button size="sm" variant="outline" class="bg-background" as={A} href={`/storages/${storage.id}`}>
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
                      <Show when={storage.products.length > 3}>
                        <Button variant="ghost" size="sm" as={A} href={`/storage/${storage.id}`}>
                          View all {summarizeProducts(storage.products).length} products
                        </Button>
                      </Show>
                    </div>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
