import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { A } from "@solidjs/router";
import { type OrganizationProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import dayjs from "dayjs";
import Fuse, { IFuseOptions } from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createMemo, createSignal, Show } from "solid-js";
import { GenericList } from "../default";

type ProductsListProps = {
  data: Accessor<OrganizationProductInfo[]>;
};

export const ProductsList = (props: ProductsListProps) => {
  const [search, setSearch] = createSignal("");

  const renderProductItem = (item: OrganizationProductInfo) => (
    <>
      <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30 w-full">
        <div class="flex flex-row items-center">
          <div class="flex flex-col gap-0.5">
            <div class="flex flex-row items-center gap-2">
              <span class="text-sm font-medium truncate">{item.product.name}</span>
            </div>
            <span class="text-xs text-muted-foreground">
              {dayjs(item.product.updatedAt ?? item.product.createdAt).format("MMM DD, YYYY - h:mm A")}
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-col p-4 gap-4 border-b">
        <div class="flex flex-row items-center justify-between">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-muted-foreground">SKU: {item.product.sku}</span>
            <Show when={item.product.weight}>
              {(weight) => (
                <span class="text-xs text-muted-foreground">
                  Weight: {weight().value} {weight().unit}
                </span>
              )}
            </Show>
            <Show when={item.product.dimensions}>
              {(dimension) => (
                <span class="text-xs text-muted-foreground">
                  Width: {dimension().width} {dimension().unit}
                </span>
              )}
            </Show>
          </div>
          <div class="flex flex-col items-end">
            <span class="text-sm font-medium font-['Geist_Mono_Variable']">
              {item.sellingPrice.toFixed(2)} {item.currency}
            </span>
          </div>
        </div>
      </div>
      <div class="flex flex-row items-center justify-between p-4">
        <div class="flex flex-row gap-2 w-max">
          <Show when={item.deletedAt}>
            <Badge variant="outline" class="bg-rose-500 border-0 text-white">
              Not in Sortiment
            </Badge>
          </Show>
          <Show when={item.product.deletedAt}>
            <Badge variant="outline" class="bg-rose-500 border-0">
              Deleted
            </Badge>
          </Show>
        </div>
        <div class="flex flex-row gap-2 w-max shrink-0">
          <Button as={A} href={`./${item.product.id}`} size="sm" class="gap-2">
            Open
            <ArrowUpRight class="size-4" />
          </Button>
        </div>
      </div>
    </>
  );

  const filteredData = createMemo(() => {
    const term = search();
    const set = props.data();
    if (!term) {
      return set;
    }
    const options: IFuseOptions<OrganizationProductInfo> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 1,
      keys: ["product.name", "product.sku"],
    };
    const fuse = new Fuse(set, options);
    return fuse.search(term).map((d) => d.item);
  });

  return (
    <div class="w-full flex flex-col gap-4">
      <div class="flex flex-row items-center justify-between gap-4">
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
      />
    </div>
  );
};
