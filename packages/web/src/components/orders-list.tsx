import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { cn } from "@/lib/utils";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type OrderInfo } from "@warehouseoetzidev/core/src/entities/orders";
import dayjs from "dayjs";
import { Accessor, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { FilterPopover } from "./filter-popover";
import { OrderStatusBadge } from "./order-status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type OrderListProps = {
  data: Accessor<OrderInfo[]>;
  onSelectedOrder: (order: OrderInfo | undefined) => void;
};

type SuppliersOrdersListProps = OrderListProps & {};

export const SuppliersOrdersList = (props: SuppliersOrdersListProps) => {
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<OrderInfo>>({
    dateRange: {
      start: props.data()[0].createdAt,
      end: props.data()[props.data().length - 1].createdAt,
      preset: "clear",
    },
    search: { term: dsearch() },
    sort: {
      default: "date",
      current: "date",
      direction: "desc",
      variants: [
        {
          field: "date",
          label: "Date",
          fn: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
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
        {
          field: "products",
          label: "Products",
          fn: (a, b) => a.products.length - b.products.length,
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
          <TextFieldInput placeholder="Search orders" class="w-full max-w-full" />
        </TextField>
        <div class="w-max">
          <FilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} />
        </div>
      </div>
      <For
        each={filteredData()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
            <span class="text-sm select-none">No orders have been added</span>
          </div>
        }
      >
        {(order) => (
          <A
            href={`./${order.id}`}
            class="flex flex-col gap-4 w-full h-content min-h-40 p-4 border rounded-lg hover:bg-primary-foreground hover:border-primary/50 shadow-sm hover:shadow-primary/10 transition-colors"
          >
            <div class="flex flex-row items-center gap-4 justify-between w-full h-content">
              <div class="flex flex-row gap-4 items-center justify-start">
                <OrderStatusBadge status={order.status} />
                <span class="text-sm font-medium leading-none">{order.title}</span>
              </div>
              <div class="flex flex-row items-center gap-2">
                <div class="flex flex-row items-center gap-2">
                  <Avatar class="size-6 border border-primary">
                    <AvatarImage
                      src={
                        (order.customer.image?.length ?? 0) > 0
                          ? order.customer.image!
                          : `https://avatar.iran.liara.run/public/boy?username=${order.customer.name}`
                      }
                    />
                    <AvatarFallback>
                      {order.customer.name
                        .toUpperCase()
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-2 w-full h-full">
              <span
                class={cn("text-sm text-muted-foreground", {
                  italic: !order.description,
                })}
              >
                {order.description ?? "No description provided"}
              </span>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 w-full h-full">
                <For
                  each={order.products}
                  fallback={
                    <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground col-span-full bg-background">
                      <span class="text-sm select-none">No products added</span>
                    </div>
                  }
                >
                  {(p) => (
                    <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-4 border bg-background">
                      <div class="flex flex-col gap-2 w-full h-full">
                        <span class="text-sm font-medium">{p.product.name}</span>
                        <span class="text-xs text-muted-foreground">
                          QTY & Price: {p.quantity} x {p.product.sellingPrice} {p.product.currency}
                        </span>
                        <Show when={p.product.weight}>
                          {(w) => (
                            <span class="text-xs text-muted-foreground">
                              Weight: {w().value} {w().unit}
                            </span>
                          )}
                        </Show>
                        <span class="text-xs text-muted-foreground">{p.product.sku}</span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
              <div class="flex w-full grow"></div>
              <span class="text-xs">{dayjs(order.updatedAt ?? order.createdAt).format("MMM DD, YYYY - h:mm A")}</span>
            </div>
          </A>
        )}
      </For>
    </div>
  );
};

type CustomersOrdersListProps = OrderListProps & {};

export const CustomersOrdersList = (props: CustomersOrdersListProps) => {
  return (
    <div class="w-full flex flex-col gap-4">
      <For
        each={props.data()}
        fallback={
          <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
            <span class="text-sm select-none">No orders have been added</span>
          </div>
        }
      >
        {(order) => (
          <A href={`./${order.id}`} class="flex flex-col gap-4 w-full h-content">
            <div class="flex flex-row items-center gap-4 justify-between w-full"></div>
          </A>
        )}
      </For>
    </div>
  );
};
