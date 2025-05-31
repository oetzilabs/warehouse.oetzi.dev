import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { cn } from "@/lib/utils";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import dayjs from "dayjs";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { FilterPopover } from "./filter-popover";

type ProductsListProps = {
  data: Accessor<ProductInfo[]>;
};

export const ProductsList = (props: ProductsListProps) => {
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<ProductInfo>>({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : (props.data()[0]?.createdAt ?? new Date()),
      end: props.data().length === 0 ? new Date() : (props.data()[props.data().length - 1]?.createdAt ?? new Date()),
      preset: "clear",
    },
    search: { term: dsearch() },
    sort: {
      default: "name",
      current: "name",
      direction: "desc",
      variants: [
        {
          field: "date",
          label: "Date",
          fn: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
        },
        {
          field: "name",
          label: "Name",
          fn: (a, b) => a.name.localeCompare(b.name),
        },
        {
          field: "price",
          label: "Price",
          fn: (a, b) => a.sellingPrice - b.sellingPrice,
        },
      ],
    },
  });

  const debouncedSearch = leadingAndTrailing(
    debounce,
    (text: string) => {
      setDSearch(text);
      setFilterConfig((prev) => ({ ...prev, search: { ...prev.search!, term: text } }));
    },
    500,
  );

  const filteredData = useFilter(props.data, filterConfig);

  return (
    <div class="w-full flex flex-col gap-4">
      <div class="flex flex-row items-center justify-between gap-4">
        <TextField
          value={search()}
          onChange={(e) => {
            setSearch(e);
            debouncedSearch(e);
          }}
          class="w-full max-w-full"
        >
          <TextFieldInput placeholder="Search products" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max">
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} />
        </div>
      </div>
      <For
        each={filteredData()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
            <span class="text-sm select-none">No products have been added</span>
          </div>
        }
      >
        {(product) => (
          <div class="flex flex-col w-full bg-background border rounded-lg overflow-hidden hover:shadow-sm transition-all">
            <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
              <div class="flex flex-row gap-4 items-center">
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium">{product.name}</span>
                  <span class="text-xs text-muted-foreground">
                    {dayjs(product.updatedAt ?? product.createdAt).format("MMM DD, YYYY - h:mm A")}
                  </span>
                </div>
              </div>
              <Button as={A} href={`./${product.id}`} size="sm" class="gap-2">
                Open
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="size-4"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </Button>
            </div>

            <div class="flex flex-col p-4 gap-4">
              <div class="flex flex-row items-center justify-between">
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs text-muted-foreground">SKU: {product.sku}</span>
                  <Show when={product.weight}>
                    {(weight) => (
                      <span class="text-xs text-muted-foreground">
                        Weight: {weight().value} {weight().unit}
                      </span>
                    )}
                  </Show>
                  <Show when={product.dimensions}>
                    {(dimension) => (
                      <span class="text-xs text-muted-foreground">
                        Width: {dimension().width} {dimension().unit}
                      </span>
                    )}
                  </Show>
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-sm font-medium">
                    {product.sellingPrice.toFixed(2)} {product.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
};
