import { OrderStatusBadge } from "@/components/badges/order-status";
import { FilterPopover } from "@/components/filters/popover";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type CustomerOrderByOrganizationIdInfo } from "@warehouseoetzidev/core/src/entities/orders";
import dayjs from "dayjs";
import Fuse, { IFuseOptions } from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import { Accessor, createMemo, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

type CustomersOrdersListProps = {
  data: Accessor<CustomerOrderByOrganizationIdInfo[]>;
};

export const CustomersOrdersList = (props: CustomersOrdersListProps) => {
  const [search, setSearch] = createSignal("");

  const renderCustomerOrderItem = (item: CustomerOrderByOrganizationIdInfo) => (
    <>
      <div class="flex flex-row items-center justify-between p-4 border-b bg-muted/30">
        <div class="flex flex-row gap-4 items-center">
          <OrderStatusBadge status={item.status} />
          <div class="flex flex-col gap-0.5">
            <div class="flex flex-row gap-2">
              <span class="text-sm font-medium">{item.title}</span>
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
            <div class="flex items-center justify-center p-8 text-sm text-muted-foreground select-none">
              No products added
            </div>
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

  const filteredData = createMemo(() => {
    const term = search();
    const set = props.data();
    if (!term) {
      return set;
    }
    const options: IFuseOptions<CustomerOrderByOrganizationIdInfo> = {
      isCaseSensitive: false,
      threshold: 0.4,
      minMatchCharLength: 1,
      keys: ["title", "status", "products.product.name", "products.product.sku"],
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
          <TextFieldInput placeholder="Search orders" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
      </div>

      <GenericList
        data={props.data}
        filteredData={filteredData}
        renderItem={renderCustomerOrderItem}
        emptyMessage="No orders have been added"
        noResultsMessage="No orders have been found"
        searchTerm={() => search()}
      />
    </div>
  );
};
