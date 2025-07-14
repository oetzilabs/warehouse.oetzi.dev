import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { A } from "@solidjs/router";
import { type CatalogInfo } from "@warehouseoetzidev/core/src/entities/catalogs";
import dayjs from "dayjs";
import Fuse, { IFuseOptions } from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createMemo, createSignal, Show } from "solid-js";
import { GenericList } from "../default";

type ProductsListProps = {
  data: Accessor<CatalogInfo["products"]>;
};

export const ProductsList = (props: ProductsListProps) => {
  const [search, setSearch] = createSignal("");

  const renderProductItem = (item: CatalogInfo["products"][number]) => (
    <div class="group flex flex-col bg-muted p-1 gap-1 grow">
      <A class="relative w-full aspect-[4/3] flex items-center justify-center" href={`/products/${item.product.id}`}>
        <Show
          when={item.product.images && item.product.images.length > 0}
          fallback={
            <div class="flex items-center justify-center w-full h-full text-muted-foreground text-xs select-none rounded-md bg-gradient-to-b from-neutral-200 dark:from-neutral-900 to-transparent">
              No Image
            </div>
          }
        >
          <img
            src={item.product.images[0].image.url}
            alt={item.product.name}
            class="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        </Show>
        <Show when={item.product.deletedAt}>
          <div class="absolute top-2 left-2 flex flex-col gap-1 z-10">
            <Show when={item.product.deletedAt}>
              <Badge variant="outline" class="bg-rose-500 border-0 text-white shadow">
                Deleted
              </Badge>
            </Show>
          </div>
        </Show>
      </A>
      <div class="flex flex-col px-4 py-3 gap-4 bg-background dark:bg-background/50 rounded-md border grow">
        <div class="flex flex-col flex-1">
          <div class="flex flex-row items-baseline justify-between gap-2">
            <A
              class="text-base font-semibold truncate block max-w-full hover:underline"
              title={item.product.name}
              href={`/products/${item.product.id}`}
            >
              {item.product.name}
            </A>
            <span class="text-sm font-['Geist_Mono_Variable'] font-medium text-primary whitespace-nowrap">
              {item.product.sellingPrice.toFixed(2)} {item.product.currency}
            </span>
          </div>
          <div class="flex flex-row items-center gap-2">
            <span class="text-xs text-muted-foreground truncate" title={item.product.sku}>
              SKU: {item.product.sku}
            </span>
            <Show when={item.product.weight}>
              {(weight) => (
                <span class="text-xs text-muted-foreground">
                  • {weight().value} {weight().unit}
                </span>
              )}
            </Show>
            <Show when={item.product.dimensions}>
              {(dimension) => (
                <span class="text-xs text-muted-foreground">
                  • {dimension().width} {dimension().unit}
                </span>
              )}
            </Show>
          </div>
        </div>
        <div class="flex flex-row items-center justify-between w-full">
          <span class="text-xs text-muted-foreground">
            {dayjs(item.product.updatedAt ?? item.product.createdAt).format("MMM DD, YYYY")}
          </span>
          <Button as={A} href={`/products/${item.product.id}`} size="sm" class="gap-2 ">
            Open
            <ArrowUpRight class="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const filteredData = createMemo(() => {
    const term = search();
    const set = props.data();
    if (!term) {
      return set;
    }
    const options: IFuseOptions<CatalogInfo["products"][number]> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 1,
      keys: ["product.name", "product.sku"],
    };
    const fuse = new Fuse(set, options);
    return fuse.search(term).map((d) => d.item);
  });

  return (
    <div class="w-full flex flex-col gap-4 pb-4">
      <div class="flex flex-row items-center justify-between gap-0 w-full bg-background">
        <TextField
          value={search()}
          onChange={(e) => {
            setSearch(e);
          }}
          class="w-full max-w-full"
        >
          <TextFieldInput placeholder="Search products" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderProductItem}
        emptyMessage="No products have been added"
        noResultsMessage="No products have been found"
        searchTerm={search}
        variant="grid"
        itemClass="hover:shadow-md !rounded-lg"
      />
    </div>
  );
};
