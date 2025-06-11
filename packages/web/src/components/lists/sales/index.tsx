import { FilterPopover } from "@/components/filters/popover";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { SaleInfo } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

type SalesListProps = {
  data: Accessor<SaleInfo[]>;
};

export function SalesList(props: SalesListProps) {
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const defaultSort = {
    default: "date",
    current: "date",
    direction: "desc" as const,
    variants: [
      {
        field: "date",
        label: "Date",
        fn: (a: SaleInfo, b: SaleInfo) => dayjs(a.createdAt).diff(dayjs(b.createdAt)),
      },
      {
        field: "items",
        label: "Items",
        fn: (a: SaleInfo, b: SaleInfo) => a.items.length - b.items.length,
      },
    ],
  } as FilterConfig<SaleInfo>["sort"];

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<SaleInfo>>({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : props.data()[0].createdAt,
      end: props.data().length === 0 ? new Date() : props.data()[props.data().length - 1].createdAt,
      preset: "clear",
    },
    search: {
      term: dsearch(),
      fields: ["id", "status", "note"],
      fuseOptions: {
        keys: ["id", "status", "note", "items.product.name", "items.product.sku"],
      },
    },
    sort: defaultSort,
    filter: {
      default: "non-deleted",
      current: "non-deleted",
      variants: [
        {
          type: "all",
          label: "All",
          fn: (item) => true,
        },
        {
          type: "non-deleted",
          label: "Non Deleted",
          fn: (item) => item.status !== "deleted",
        },
        {
          type: "deleted",
          label: "Deleted",
          fn: (item) => item.status === "deleted",
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

  const renderSaleItem = (sale: SaleInfo) => (
    <>
      <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
        <div class="flex flex-row gap-4 items-center">
          <div class="flex flex-col gap-0.5">
            <span class="text-sm font-medium">Sale #{sale.id}</span>
            <span class="text-xs text-muted-foreground">
              {dayjs(sale.updatedAt ?? sale.createdAt).format("MMM DD, YYYY - h:mm A")}
            </span>
          </div>
        </div>
        <Button as={A} href={`/sales/${sale.id}`} size="sm" class="gap-2">
          Open
          <ArrowUpRight class="size-4" />
        </Button>
      </div>

      <div class="flex flex-col">
        <For
          each={sale.items.slice(0, 5)}
          fallback={
            <div class="flex items-center justify-center p-8 text-sm text-muted-foreground">No items added</div>
          }
        >
          {(item) => (
            <div class="flex flex-col border-b last:border-b-0 p-4 gap-4">
              <div class="flex flex-row items-center justify-between">
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium">{item.product.name}</span>
                  <span class="text-xs text-muted-foreground">SKU: {item.product.sku}</span>
                  <Show when={item.product.organizations[0].tg}>
                    {(tg) => (
                      <span class="text-sm text-muted-foreground">
                        {tg().name} ({tg().crs[0]?.tr.rate}%)
                      </span>
                    )}
                  </Show>
                  <Show when={item.product.weight}>
                    {(weight) => (
                      <span class="text-xs text-muted-foreground">
                        Weight: {weight().value} {weight().unit}
                      </span>
                    )}
                  </Show>
                </div>
                <div class="flex flex-col items-end">
                  <div class="flex flex-row items-baseline gap-1">
                    <span class="text-xs text-muted-foreground">{item.quantity}x</span>
                    <span class="text-sm font-medium">{item.product.organizations[0].sellingPrice.toFixed(2)}</span>
                  </div>
                  <span class="text-xs text-muted-foreground">
                    {(item.product.organizations[0].sellingPrice * item.quantity).toFixed(2)} {item.product.currency}
                  </span>
                  <Show when={item.product.organizations[0].tg}>
                    {(tg) => (
                      <span class="text-xs text-muted-foreground">
                        {(
                          (item.product.organizations[0].sellingPrice * item.quantity * (tg().crs[0]?.tr.rate ?? 0)) /
                          100
                        ).toFixed(2)}{" "}
                        {item.product.currency} Tax
                      </span>
                    )}
                  </Show>
                </div>
              </div>
            </div>
          )}
        </For>
        <Show when={sale.items.length > 5}>
          <div class="flex flex-row items-center justify-between p-4 border-t bg-muted/30">
            <span class="text-sm text-muted-foreground">+ {sale.items.length - 5} more items</span>
            <span class="text-sm text-muted-foreground">
              {sale.items
                .slice(5)
                .reduce((acc, item) => acc + item.product.organizations[0].sellingPrice * item.quantity, 0)
                .toFixed(2)}{" "}
              {sale.items[0].product.currency}
            </span>
          </div>
        </Show>
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
          <TextFieldInput placeholder="Search sales" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max">
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} />
        </div>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderSaleItem}
        emptyMessage="No sales have been added"
        noResultsMessage="No sales have been found"
        searchTerm={() => filterConfig.search.term}
      />
    </div>
  );
}
