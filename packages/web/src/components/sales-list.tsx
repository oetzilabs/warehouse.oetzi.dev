import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { SaleInfo } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { FilterPopover } from "./filter-popover";
import { Button } from "./ui/button";
import { TextField, TextFieldInput } from "./ui/text-field";

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
    search: { term: dsearch() },
    sort: defaultSort,
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
      <For
        each={filteredData()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
            <span class="text-sm select-none">
              <Show when={props.data().length === 0}>No sales have been added</Show>
              <Show when={props.data().length > 0 && filterConfig.search.term.length > 0}>
                No sales have been found
              </Show>
            </span>
          </div>
        }
      >
        {(sale) => (
          <div class="flex flex-col w-full bg-background border rounded-lg overflow-hidden hover:shadow-sm transition-all">
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

            <div class="flex flex-col">
              <For
                each={sale.items}
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
                        <Show when={item.product.tg}>
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
                          <span class="text-sm font-medium">{item.product.sellingPrice.toFixed(2)}</span>
                        </div>
                        <span class="text-xs text-muted-foreground">
                          {(item.product.sellingPrice * item.quantity).toFixed(2)} {item.product.currency}
                        </span>
                        <Show when={item.product.tg}>
                          {(tg) => (
                            <span class="text-xs text-muted-foreground">
                              {(
                                (item.product.sellingPrice * item.quantity * (tg().crs[0]?.tr.rate ?? 0)) /
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
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
