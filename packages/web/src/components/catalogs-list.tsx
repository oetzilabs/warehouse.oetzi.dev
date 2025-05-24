import { cn } from "@/lib/utils";
import { A } from "@solidjs/router";
import { type CatalogInfo } from "@warehouseoetzidev/core/src/entities/catalogs";
import dayjs from "dayjs";
import { Accessor, For, Show } from "solid-js";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type CatalogsListProps = {
  data: Accessor<CatalogInfo[]>;
};

export const CatalogsList = (props: CatalogsListProps) => {
  return (
    <div class="w-full flex flex-col gap-4">
      <For
        each={props.data()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
            <span class="text-sm select-none">No catalogs have been added</span>
          </div>
        }
      >
        {(catalog) => (
          <A
            href={`./${catalog.id}`}
            class="flex flex-col gap-4 w-full h-content min-h-40 p-4 border rounded-lg hover:bg-primary-foreground hover:border-primary/50 shadow-sm hover:shadow-primary/10 transition-colors"
          >
            <div class="flex flex-row items-center gap-4 justify-between w-full h-content">
              <div class="flex flex-row gap-4 items-center justify-start">
                <span class="text-sm font-medium leading-none">{catalog.name}</span>
                <Show when={catalog.deletedAt}>
                  <span class="text-xs text-red-500">Deleted</span>
                </Show>
              </div>
            </div>
            <div class="flex flex-col gap-2 w-full h-full">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 w-full h-full">
                <For
                  each={catalog.products.map((p) => p.product)}
                  fallback={
                    <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground col-span-full bg-background">
                      <span class="text-sm select-none">No products added</span>
                    </div>
                  }
                >
                  {(product) => (
                    <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-4 border bg-background">
                      <div class="flex flex-col gap-2 w-full h-full">
                        <span class="text-sm font-medium">{product.name}</span>
                        <span class="text-xs text-muted-foreground">
                          Price: {product.sellingPrice} {product.currency}
                        </span>
                        <span class="text-xs text-muted-foreground">{product.sku}</span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <div class="flex w-full grow"></div>
              <span class="text-xs">
                {dayjs(catalog.updatedAt ?? catalog.createdAt).format("MMM DD, YYYY - h:mm A")}
              </span>
            </div>
          </A>
        )}
      </For>
    </div>
  );
};
