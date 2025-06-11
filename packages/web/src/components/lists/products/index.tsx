import { FilterPopover } from "@/components/filters/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type OrganizationProductInfo, type ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import dayjs from "dayjs";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

type ProductsListProps = {
  data: Accessor<OrganizationProductInfo[]>;
};

export const ProductsList = (props: ProductsListProps) => {
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<OrganizationProductInfo>>({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : (props.data()[0]?.product.createdAt ?? new Date()),
      end:
        props.data().length === 0
          ? new Date()
          : (props.data()[props.data().length - 1]?.product.createdAt ?? new Date()),
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
          fn: (a, b) => dayjs(a.product.createdAt).unix() - dayjs(b.product.createdAt).unix(),
        },
        {
          field: "name",
          label: "Name",
          fn: (a, b) => a.product.name.localeCompare(b.product.name),
        },
        {
          field: "price",
          label: "Price",
          fn: (a, b) => a.sellingPrice - b.sellingPrice,
        },
      ],
    },
    filter: {
      default: null,
      current: null,
      variants: [],
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
  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  };

  const renderProductItem = (item: OrganizationProductInfo) => (
    <>
      <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30 w-full">
        <div class="flex flex-row items-center">
          <div class="flex flex-col gap-0.5">
            <div class="flex flex-row items-center gap-2">
              <span class="text-sm font-medium truncate">{truncateText(item.product.name, 40)}</span>
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
            <span class="text-xs text-muted-foreground">
              {dayjs(item.product.updatedAt ?? item.product.createdAt).format("MMM DD, YYYY - h:mm A")}
            </span>
          </div>
        </div>
        <div class="flex flex-row gap-2 w-max">
          <Button as={A} href={`./${item.product.id}`} size="sm" class="gap-2">
            Open
            <ArrowUpRight class="size-4" />
          </Button>
        </div>
      </div>

      <div class="flex flex-col p-4 gap-4">
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
    </>
  );

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

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderProductItem}
        emptyMessage="No products have been added"
        noResultsMessage="No products have been found"
        searchTerm={() => filterConfig.search.term}
        variant="grid"
      />
    </div>
  );
};
