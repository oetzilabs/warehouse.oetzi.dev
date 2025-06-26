import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressValueLabel } from "@/components/ui/progress";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { cookieStorage, makePersisted } from "@solid-primitives/storage";
import { A } from "@solidjs/router";
import { type StorageStatisticsInfo } from "@warehouseoetzidev/core/src/entities/inventory";
import Fuse, { IFuseOptions } from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import List from "lucide-solid/icons/list";
import Package from "lucide-solid/icons/package";
import { Accessor, createMemo, createSignal, For, Match, Show, Switch } from "solid-js";

type StorageStatisticsListProps = {
  storages: Accessor<StorageStatisticsInfo>;
};

export const StorageStatisticsList = (props: StorageStatisticsListProps) => {
  const [search, setSearch] = createSignal("");
  const [view, setView] = makePersisted(createSignal<"space" | "list">("list"), {
    name: "storage-view",
    storage: cookieStorage,
  });

  const summarizeProducts = (products: { product: { name: string; sku: string } }[]) => {
    const summary = new Map<string, number>();
    products.forEach((p) => {
      const name = p.product.name;
      summary.set(name, (summary.get(name) || 0) + 1);
    });
    return Array.from(summary.entries()) as [string, number][];
  };

  const filteredData = createMemo(() => {
    const term = search();
    const set = props.storages().storages;
    if (!term) {
      return set;
    }
    const options: IFuseOptions<StorageStatisticsInfo["storages"][number]> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 3,
      keys: ["name", "description", "productSummary.product.name", "productSummary.product.sku"],
    };
    const fuse = new Fuse(set, options);
    return fuse.search(term).map((d) => d.item);
  });

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
          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              setView((v) => (v === "space" ? "list" : "space"));
            }}
          >
            <Show when={view() === "space"}>
              <Package class="size-4" />
            </Show>
            <Show when={view() === "list"}>
              <List class="size-4" />
            </Show>
          </Button>
        </div>

        <Show
          when={filteredData().length > 0}
          fallback={<div class="col-span-full p-8 text-center text-muted-foreground">No storages found</div>}
        >
          <Switch>
            <Match when={view() === "space"}>
              <div class="flex flex-row border overflow-hidden rounded-lg">
                <For each={filteredData()}>
                  {(storage) => (
                    <Switch>
                      <Match when={storage.type.name === "rack"}>
                        <div
                          class="flex flex-col border-r last:border-r-0"
                          style={{
                            height: `${storage.bounding_box.height}px`,
                            width: "100%",
                          }}
                        >
                          <For each={storage.children}>
                            {(child) => (
                              <div
                                class="flex flex-col items-center justify-center"
                                style={{
                                  height: `${child.bounding_box.height}px`,
                                  width: `${child.bounding_box.width}px`,
                                }}
                              >
                                <div class="flex flex-col items-center justify-center">
                                  <For
                                    each={
                                      // @ts-ignore
                                      summarizeProducts(child.products)
                                    }
                                  >
                                    {([name, amount]) => (
                                      <div class="flex flex-col items-center justify-center">
                                        <span class="text-sm font-medium">
                                          {amount}x {name}
                                        </span>
                                      </div>
                                    )}
                                  </For>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </Match>
                      <Match when={storage.type.name === "bin"}>
                        <div
                          class="flex flex-col border-r last:border-r-0"
                          style={{
                            height: `${storage.bounding_box.height}px`,
                            width: "100%",
                          }}
                        >
                          <div class="flex flex-col items-center justify-center bg-muted-foreground/10 dark:bg-muted/30 border-b uppercase py-2">
                            {storage.type.name} '{storage.name}'
                          </div>
                          <div class="flex flex-col gap-2 p-2">
                            <For each={summarizeProducts(storage.products.map((p) => ({ product: p })))}>
                              {([name, amount]) => (
                                <div class="flex flex-col items-center justify-center">
                                  <span class="text-sm font-medium">
                                    {amount}x {name}
                                  </span>
                                </div>
                              )}
                            </For>
                          </div>
                        </div>
                      </Match>
                    </Switch>
                  )}
                </For>
              </div>
            </Match>
            <Match when={view() === "list"}>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                  <span class="truncate font-['Geist_Mono_Variable']" title={pc.product.name}>
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
              </div>
            </Match>
          </Switch>
        </Show>
      </div>
    </div>
  );
};
