import { Skeleton } from "@/components/ui/skeleton";
import { getProductBrands } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { createAsync } from "@solidjs/router";
import { type BrandInfo } from "@warehouseoetzidev/core/src/entities/brands";
import Fuse, { IFuseOptions } from "fuse.js";
import { createSignal, For, Show, Suspense } from "solid-js";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { useNewProductForm } from "./form";

export const Brand = () => {
  const form = useNewProductForm();
  const brands = createAsync(() => getProductBrands(), { deferStream: true });
  const [search, setSearch] = createSignal("");

  const filteredBrands = (set: BrandInfo[]) => {
    const term = search();
    if (!term) {
      return set;
    }
    const options: IFuseOptions<BrandInfo> = {
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
        <h2 class="text-lg font-semibold">Brand</h2>
        <p class="text-muted-foreground text-sm">
          Enter the main details for your product, such as name, barcode, SKU, and description.
        </p>
      </div>
      <div class="flex flex-col gap-4 col-span-3">
        <TextField value={search()} onChange={(e) => setSearch(e)} class="w-full max-w-full">
          <TextFieldInput placeholder="Search brands" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <form.Field name="brand_id">
          {(field) => (
            <div class="gap-2 flex flex-col">
              <span class="capitalize pl-1 text-sm font-medium">Brand</span>
              <Suspense
                fallback={
                  <div class="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <Skeleton class="w-48 h-20" />
                    <Skeleton class="w-48 h-20" />
                  </div>
                }
              >
                <Show when={brands()}>
                  {(brandsList) => (
                    <div class="grid gap-2 grid-cols-1 md:grid-cols-2">
                      <For each={filteredBrands(brandsList())}>
                        {(brand) => (
                          <div
                            class={cn(
                              "bg-muted-foreground/5 rounded-lg p-3 flex flex-col gap-1 border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer",
                              {
                                "text-white bg-indigo-600 hover:bg-indigo-600": field().state.value === brand.id,
                              },
                            )}
                            onClick={() => {
                              if (field().state.value === brand.id) {
                                field().setValue(null);
                              } else {
                                field().setValue(brand.id);
                              }
                            }}
                          >
                            <span class="text-sm font-medium">{brand.name}</span>
                            <span
                              class={cn("text-xs", {
                                "text-muted-foreground": field().state.value !== brand.id,
                              })}
                            >
                              {brand.description ?? ""}
                            </span>
                          </div>
                        )}
                      </For>
                    </div>
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
