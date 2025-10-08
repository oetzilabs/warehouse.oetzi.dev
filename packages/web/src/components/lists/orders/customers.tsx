import { OrderStatusBadge } from "@/components/badges/order-status";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import Calendar from "@corvu/calendar";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type CustomerOrderByOrganizationIdInfo } from "@warehouseoetzidev/core/src/entities/orders";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import Fuse, { IFuseOptions } from "fuse.js";
import NavArrowLeft from "lucide-solid/icons/arrow-left";
import NavArrowRight from "lucide-solid/icons/arrow-right";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import CalendarIcon from "lucide-solid/icons/calendar";
import ArrowLeft from "lucide-solid/icons/chevron-left";
import ArrowRight from "lucide-solid/icons/chevron-right";
import Eye from "lucide-solid/icons/eye";
import EyeOff from "lucide-solid/icons/eye-off";
import { Accessor, createEffect, createMemo, createSignal, For, Index, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { GenericList } from "../default";

dayjs.extend(isBetween);

const { format: formatWeekdayLong } = new Intl.DateTimeFormat("en", { weekday: "long" });
const { format: formatWeekdayShort } = new Intl.DateTimeFormat("en", { weekday: "short" });
const { format: formatMonth } = new Intl.DateTimeFormat("en", { month: "long" });

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

  const [customDateRange, setCustomDateRange] = createSignal<[Date, Date]>([new Date(), new Date()]);

  createEffect(() => {
    const set = props.data();
    if (set.length === 0) {
      setCustomDateRange([new Date(), new Date()]);
      return;
    }
    const min = set.reduce((min, o) => (dayjs(o.createdAt).isBefore(dayjs(min.createdAt)) ? o : min));
    const max = set.reduce((max, o) => (dayjs(o.createdAt).isAfter(dayjs(max.createdAt)) ? o : max));
    setCustomDateRange([dayjs(min.createdAt).toDate(), dayjs(max.createdAt).toDate()]);
  });

  const dateRange = createMemo(() => {
    const set = props.data();
    if (set.length === 0) return "N/A";
    const cdr = customDateRange();
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
    set = set.filter((o) => {
      const createdAt = dayjs(o.createdAt);
      return createdAt.isBetween(cdr[0], cdr[1], null, "[]");
    });
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
                setCustomDateRange((cdr) => [
                  dayjs(cdr[0]).subtract(7, "day").toDate(),
                  dayjs(cdr[1]).subtract(7, "day").toDate(),
                ]);
              }}
            >
              <ArrowLeft class="size-4" />
              <span class="sr-only">Previous week</span>
            </Button>
            <Popover sameWidth={false}>
              <PopoverTrigger
                as={Button}
                size="lg"
                variant="ghost"
                class="size-10 rounded-lg rounded-l-none rounded-r-none border w-max px-4"
              >
                <span>{dateRange()}</span>
              </PopoverTrigger>
              <PopoverContent class="w-full gap-2 flex flex-col">
                <Button
                  class=""
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // reset the date range to the set of orders
                    setCustomDateRange([
                      props.data().reduce((min, o) => (dayjs(o.createdAt).isBefore(dayjs(min.createdAt)) ? o : min))
                        .createdAt,
                      props.data().reduce((max, o) => (dayjs(o.createdAt).isAfter(dayjs(max.createdAt)) ? o : max))
                        .createdAt,
                    ]);
                  }}
                >
                  Reset
                </Button>
                <Calendar
                  mode="range"
                  numberOfMonths={2}
                  initialValue={{
                    from: customDateRange()[0],
                    to: customDateRange()[1],
                  }}
                  onValueChange={(date) => {
                    if (!date.from || !date.to) return;
                    setCustomDateRange([date.from, date.to]);
                  }}
                >
                  {(props) => {
                    return (
                      <div class="relative w-full">
                        <Calendar.Nav
                          action="prev-month"
                          aria-label="Go to previous month"
                          as={Button}
                          size="icon"
                          class="absolute left-0"
                          variant="secondary"
                          type="button"
                        >
                          <NavArrowLeft class="size-4" />
                        </Calendar.Nav>
                        <Calendar.Nav
                          action="next-month"
                          aria-label="Go to next month"
                          as={Button}
                          size="icon"
                          class="absolute right-0"
                          variant="secondary"
                          type="button"
                        >
                          <NavArrowRight class="size-4" />
                        </Calendar.Nav>
                        <div class="w-full h-content flex flex-row gap-4">
                          <Index each={props.months}>
                            {(month, index) => (
                              <div class="w-full flex flex-col gap-4">
                                <div class="flex h-8 items-center justify-center">
                                  <Calendar.Label index={index} class="text-sm  select-none">
                                    {formatMonth(month().month)} {month().month.getFullYear()}
                                  </Calendar.Label>
                                </div>
                                <Calendar.Table index={index} class="w-full">
                                  <thead>
                                    <tr>
                                      <Index each={props.weekdays}>
                                        {(weekday) => (
                                          <Calendar.HeadCell
                                            abbr={formatWeekdayLong(weekday())}
                                            class="w-8 flex-1 pb-1 text-sm font-normal text-muted-foreground select-none"
                                          >
                                            {formatWeekdayShort(weekday())}
                                          </Calendar.HeadCell>
                                        )}
                                      </Index>
                                    </tr>
                                  </thead>
                                  <tbody class="gap-0">
                                    <Index each={month().weeks}>
                                      {(week) => (
                                        <tr>
                                          <Index each={week()}>
                                            {(day) => (
                                              <Calendar.Cell class="p-0">
                                                <Calendar.CellTrigger
                                                  type="button"
                                                  day={day()}
                                                  month={month().month}
                                                  as={Button}
                                                  size="sm"
                                                  variant="ghost"
                                                  class={cn(
                                                    "inline-flex w-full bg-background rounded-none",
                                                    dayjs(day()).isSame(customDateRange()[0], "day")
                                                      ? "rounded-l-md"
                                                      : dayjs(day()).isSame(customDateRange()[1], "day")
                                                        ? "rounded-r-md"
                                                        : dayjs(day()).isBetween(
                                                              customDateRange()[0],
                                                              customDateRange()[1],
                                                            )
                                                          ? "rounded-none"
                                                          : "rounded-lg",
                                                    {
                                                      "bg-primary/10 text-primary/70": dayjs(day()).isBetween(
                                                        customDateRange()[0],
                                                        customDateRange()[1],
                                                      ),
                                                      "bg-primary text-white": dayjs().isSame(day(), "day"),
                                                      "!bg-primary/50 !text-primary":
                                                        dayjs(day()).isSame(customDateRange()[0], "day") ||
                                                        dayjs(day()).isSame(customDateRange()[1], "day"),
                                                    },
                                                  )}
                                                >
                                                  {day().getDate()}
                                                </Calendar.CellTrigger>
                                              </Calendar.Cell>
                                            )}
                                          </Index>
                                        </tr>
                                      )}
                                    </Index>
                                  </tbody>
                                </Calendar.Table>
                              </div>
                            )}
                          </Index>
                        </div>
                      </div>
                    );
                  }}
                </Calendar>
              </PopoverContent>
            </Popover>
            <Button
              size="icon"
              variant="ghost"
              class="size-10 rounded-lg rounded-l-none border border-l-0"
              onClick={() => {
                setCustomDateRange((cdr) => [
                  dayjs(cdr[0]).add(7, "day").toDate(),
                  dayjs(cdr[1]).add(7, "day").toDate(),
                ]);
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
