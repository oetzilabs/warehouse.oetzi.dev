import { OrderStatusBadge } from "@/components/badges/order-status";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type CustomerOrderByOrganizationIdInfo } from "@warehouseoetzidev/core/src/entities/orders";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import Fuse, { IFuseOptions } from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import CalendarIcon from "lucide-solid/icons/calendar";
import ArrowLeft from "lucide-solid/icons/chevron-left";
import ArrowRight from "lucide-solid/icons/chevron-right";
import Eye from "lucide-solid/icons/eye";
import EyeOff from "lucide-solid/icons/eye-off";
import { Accessor, createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericList } from "../default";

dayjs.extend(isBetween);

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
              <span class="text-sm text-muted-foreground select-none">{item.barcode}</span>
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

  const [customDateRange, setCustomDateRange] = createSignal<[Date, Date] | undefined>(undefined);

  createEffect(() => {
    const set = props.data();
    if (set.length === 0) return;
    if (!customDateRange()) {
      if (set.length > 0) {
        const min = set.reduce((min, o) => (dayjs(o.createdAt).isBefore(dayjs(min.createdAt)) ? o : min));
        const max = set.reduce((max, o) => (dayjs(o.createdAt).isAfter(dayjs(max.createdAt)) ? o : max));
        setCustomDateRange([dayjs(min.createdAt).toDate(), dayjs(max.createdAt).toDate()]);
      }
    }
  });

  const dateRange = createMemo(() => {
    const set = props.data();
    if (set.length === 0) return "N/A";
    const cdr = customDateRange();
    if (!cdr) {
      return (
        dayjs(set[0].createdAt).format("MMM DD, YYYY") +
        " - " +
        dayjs(set[set.length - 1].createdAt).format("MMM DD, YYYY")
      );
    }
    return dayjs(cdr[0]).format("MMM DD, YYYY") + " - " + dayjs(cdr[1]).format("MMM DD, YYYY");
  });

  const filteredData = createMemo(() => {
    const term = search();
    let set = props.data();
    if (term) {
      const options: IFuseOptions<CustomerOrderByOrganizationIdInfo> = {
        isCaseSensitive: false,
        threshold: 0.4,
        minMatchCharLength: 1,
        keys: ["title", "barcode", "products.product.name", "products.product.sku"],
      };
      const fuse = new Fuse(set, options);
      set = fuse.search(term).map((d) => d.item);
    }
    const cdr = customDateRange();
    if (cdr) {
      set = set.filter((o) => {
        const createdAt = dayjs(o.createdAt);
        return createdAt.isBetween(cdr[0], cdr[1], null, "[]");
      });
    }
    return set;
  });

  return (
    <div class="w-full flex flex-col gap-4 pb-4">
      <div class="flex flex-row items-center justify-between gap-4 w-full bg-background">
        <TextField
          value={search()}
          onChange={(e) => {
            setSearch(e);
          }}
          class="w-full max-w-full"
        >
          <TextFieldInput placeholder="Search orders" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max flex flex-row items-center gap-4">
          <div class="w-max flex flex-row items-center gap-0">
            <Button
              size="icon"
              variant="ghost"
              class="size-10 rounded-lg rounded-r-none border border-r-0"
              onClick={() => {
                setCustomDateRange((cdr) => {
                  if (!cdr) return cdr;
                  return [dayjs(cdr[0]).subtract(7, "day").toDate(), dayjs(cdr[1]).subtract(7, "day").toDate()];
                });
              }}
            >
              <ArrowLeft class="size-4" />
              <span class="sr-only">Previous week</span>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              class="size-10 rounded-lg rounded-l-none rounded-r-none border w-max px-4"
            >
              <span>{dateRange()}</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              class="size-10 rounded-lg rounded-l-none border border-l-0"
              onClick={() => {
                setCustomDateRange((cdr) => {
                  if (!cdr) return cdr;
                  return [dayjs(cdr[0]).add(7, "day").toDate(), dayjs(cdr[1]).add(7, "day").toDate()];
                });
              }}
            >
              <ArrowRight class="size-4" />
              <span class="sr-only">Next week</span>
            </Button>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4 w-full grow">
        <GenericList
          data={props.data}
          filteredData={filteredData}
          renderItem={renderCustomerOrderItem}
          emptyMessage="No orders have been added"
          noResultsMessage="No orders have been found"
          searchTerm={() => search()}
        />
      </div>
    </div>
  );
};
