import { OrderStatusBadge } from "@/components/badges/order-status";
import { FilterPopover } from "@/components/filters/popover";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type SupplierOrderInfo } from "@warehouseoetzidev/core/src/entities/suppliers";
import dayjs from "dayjs";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

type PurchasesListProps = {
  data: Accessor<{ supplier_id: string; order: SupplierOrderInfo; createdAt: Date }[]>;
};

export const PurchasesList = (props: PurchasesListProps) => {
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
        fn: (a, b) => {
          const aTime = dayjs(a.order.createdAt).valueOf();
          const bTime = dayjs(b.order.createdAt).valueOf();
          return aTime - bTime;
        },
      },
      {
        field: "price",
        label: "Price",
        fn: (a, b) => {
          const aTotal = a.order.prods.reduce((acc, p) => acc + p.quantity * p.product.sellingPrice, 0);
          const bTotal = b.order.prods.reduce((acc, p) => acc + p.quantity * p.product.sellingPrice, 0);
          return aTotal - bTotal;
        },
      },
    ],
  } as FilterConfig<{ supplier_id: string; order: SupplierOrderInfo; createdAt: Date }>["sort"];

  const [filterConfig, setFilterConfig] = createStore<
    FilterConfig<{ supplier_id: string; order: SupplierOrderInfo; createdAt: Date }>
  >({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : props.data()[0].order.createdAt,
      end: props.data().length === 0 ? new Date() : props.data()[props.data().length - 1].order.createdAt,
      preset: "clear",
    },
    search: { term: dsearch() },
    sort: defaultSort,
    itemKey: "order", // Add this line
    filter: {
      default: null,
      current: null,
      variants: [],
    },
  });

  // Add a handler for resetting sort
  const resetSort = () => {
    setFilterConfig("sort", defaultSort);
  };

  const debouncedSearch = leadingAndTrailing(
    debounce,
    (text: string) => {
      setDSearch(text);
      setFilterConfig((prev) => ({ ...prev, search: { ...prev.search!, term: text } }));
    },
    500,
  );

  const filteredData = useFilter(props.data, filterConfig);

  const renderPurchaseItem = (item: { supplier_id: string; order: SupplierOrderInfo; createdAt: Date }) => (
    <>
      <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
        <div class="flex flex-row gap-4 items-center">
          <div class="flex flex-col gap-0.5">
            <div class="flex flex-row gap-2">
              <span class="text-sm font-medium">{item.order.title}</span>
              <OrderStatusBadge status={item.order.status} />
            </div>
            <span class="text-xs text-muted-foreground">
              {dayjs(item.order.updatedAt ?? item.order.createdAt).format("MMM DD, YYYY - h:mm A")}
            </span>
          </div>
        </div>
        <Button as={A} href={`/suppliers/${item.supplier_id}/orders/${item.order.id}`} size="sm" class="gap-2">
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
          each={item.order.prods.slice(0, 5)}
          fallback={
            <div class="flex items-center justify-center p-8 text-sm text-muted-foreground">No products added</div>
          }
        >
          {(p) => (
            <div class="flex flex-col border-b last:border-b-0 p-4 gap-4">
              <div class="flex flex-row items-center justify-between">
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium">{p.product.name}</span>
                  <span class="text-xs text-muted-foreground">SKU: {p.product.sku}</span>
                  <Show when={p.product.weight}>
                    {(weight) => (
                      <span class="text-xs text-muted-foreground">
                        Weight: {weight().value} {weight().unit}
                      </span>
                    )}
                  </Show>
                </div>
                <div class="flex flex-col items-end">
                  <div class="flex flex-row items-baseline gap-1">
                    <span class="text-xs text-muted-foreground">{p.quantity}x</span>
                    <span class="text-sm font-medium ">{p.product.sellingPrice.toFixed(2)}</span>
                  </div>
                  <span class="text-sm text-muted-foreground">
                    {(p.product.sellingPrice * p.quantity).toFixed(2)} {p.product.currency}
                  </span>
                </div>
              </div>
            </div>
          )}
        </For>
        <Show when={item.order.prods.length > 5}>
          <div class="flex flex-row items-center justify-between p-4 border-t bg-muted/30">
            <span class="text-sm text-muted-foreground">+ {item.order.prods.length - 5} more products</span>
            <span class="text-sm text-muted-foreground">
              {item.order.prods
                .slice(5)
                .reduce((acc, p) => acc + p.product.sellingPrice * p.quantity, 0)
                .toFixed(2)}{" "}
              {item.order.prods[0].product.currency}
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
          class="w-full max-w-full "
        >
          <TextFieldInput placeholder="Search orders" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max">
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} itemKey="order" />
        </div>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderPurchaseItem}
        emptyMessage="No orders have been added"
        noResultsMessage="No orders have been found"
        searchTerm={() => filterConfig.search.term}
      />
    </div>
  );
};
