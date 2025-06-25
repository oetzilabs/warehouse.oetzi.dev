import { OrderStatusBadge } from "@/components/badges/order-status";
import { FilterPopover } from "@/components/filters/popover";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type CustomerOrderByOrganizationIdInfo } from "@warehouseoetzidev/core/src/entities/orders";
import dayjs from "dayjs";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

type CustomersOrdersListProps = {
  data: Accessor<CustomerOrderByOrganizationIdInfo[]>;
};

export const CustomersOrdersList = (props: CustomersOrdersListProps) => {
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
          return dayjs(a.createdAt).diff(dayjs(b.createdAt));
        },
      },
      {
        field: "price",
        label: "Price",
        fn: (a, b) => {
          const aTotal = a.products.reduce((acc, p) => acc + p.quantity * p.product.sellingPrice, 0);
          const bTotal = b.products.reduce((acc, p) => acc + p.quantity * p.product.sellingPrice, 0);
          return aTotal - bTotal;
        },
      },
    ],
  } as FilterConfig<CustomerOrderByOrganizationIdInfo>["sort"];

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<CustomerOrderByOrganizationIdInfo>>({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : props.data()[0].createdAt,
      end: props.data().length === 0 ? new Date() : props.data()[props.data().length - 1].createdAt,
      preset: "clear",
    },
    search: { term: dsearch() },
    sort: defaultSort,
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

  const filteredData = useFilter(props.data, filterConfig);

  const renderCustomerOrderItem = (item: CustomerOrderByOrganizationIdInfo) => (
    <>
      <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
        <div class="flex flex-row gap-4 items-center">
          <div class="flex flex-col gap-0.5">
            <div class="flex flex-row gap-2">
              <span class="text-sm font-medium">{item.title}</span>
              <OrderStatusBadge status={item.status} />
            </div>
            <span class="text-xs text-muted-foreground">
              {dayjs(item.updatedAt ?? item.createdAt).format("MMM DD, YYYY - h:mm A")}
            </span>
          </div>
        </div>
        <Button as={A} href={`/orders/${item.id}`} size="sm" class="gap-2">
          Open
          <ArrowUpRight class="size-4" />
        </Button>
      </div>

      <div class="flex flex-col">
        <For
          each={item.products.slice(0, 5)}
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
                  <span class="text-xs text-muted-foreground">
                    Total: {(p.product.sellingPrice * p.quantity).toFixed(2)} {p.product.currency}
                  </span>
                </div>
              </div>
            </div>
          )}
        </For>
        <Show when={item.products.length > 5}>
          <div class="flex flex-row items-center justify-between p-4 border-t bg-muted/30">
            <span class="text-sm text-muted-foreground">+ {item.products.length - 5} more products</span>
            <span class="text-sm text-muted-foreground">
              {item.products
                .slice(5)
                .reduce((acc, p) => acc + p.product.sellingPrice * p.quantity, 0)
                .toFixed(2)}{" "}
              {item.products[0].product.currency}
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
          }}
          class="w-full max-w-full"
        >
          <TextFieldInput placeholder="Search orders" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max">
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} />
        </div>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderCustomerOrderItem}
        emptyMessage="No orders have been added"
        noResultsMessage="No orders have been found"
        searchTerm={() => filterConfig.search.term}
      />
    </div>
  );
};
