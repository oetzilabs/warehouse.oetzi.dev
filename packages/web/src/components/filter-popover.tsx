import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterConfig, WithDates } from "@/lib/filtering";
import { cn } from "@/lib/utils";
import Calendar from "@corvu/calendar";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import ArrowRight from "lucide-solid/icons/arrow-right";
import { Accessor, For, Index, Show } from "solid-js";

type FilterPopoverProps<T extends WithDates> = {
  config: FilterConfig<T>;
  onChange: (config: FilterConfig<T>) => void;
  data: Accessor<T[]>;
  itemKey?: keyof T;
};

export const FilterPopover = <T extends WithDates>(props: FilterPopoverProps<T>) => {
  const { format: formatWeekdayLong } = new Intl.DateTimeFormat("en", { weekday: "long" });
  const { format: formatWeekdayShort } = new Intl.DateTimeFormat("en", { weekday: "short" });
  const { format: formatMonth } = new Intl.DateTimeFormat("en", { month: "long" });

  const getDate = (item: T) => {
    return props.itemKey ? (item[props.itemKey] as any)?.createdAt : item.createdAt;
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger as={Button} size="lg" disabled={props.config.disabled()} class="h-10 px-5">
        Filters & Sort
      </PopoverTrigger>
      <PopoverContent class="w-[720px]">
        <div class="grid gap-4">
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Date Range</h4>
            <div class="grid grid-cols-2 gap-2">
              <Button
                variant={props.config.dateRange?.preset === "start_of_week" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    dateRange: {
                      ...props.config.dateRange!,
                      start: dayjs().startOf("week").toDate(),
                      end: dayjs().endOf("week").toDate(),
                      preset: "start_of_week",
                    },
                  })
                }
              >
                Start of Week
              </Button>
              <Button
                variant={props.config.dateRange?.preset === "start_of_month" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    dateRange: {
                      ...props.config.dateRange!,
                      start: dayjs().startOf("month").toDate(),
                      end: dayjs().endOf("month").toDate(),
                      preset: "start_of_month",
                    },
                  })
                }
              >
                Start of Month
              </Button>
              <Button
                variant={props.config.dateRange?.preset === "previous_week" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    dateRange: {
                      ...props.config.dateRange!,
                      start: dayjs().subtract(1, "week").startOf("week").toDate(),
                      end: dayjs().subtract(1, "week").endOf("week").toDate(),
                      preset: "previous_week",
                    },
                  })
                }
              >
                Previous Week
              </Button>
              <Button
                variant={props.config.dateRange?.preset === "previous_month" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    dateRange: {
                      ...props.config.dateRange!,
                      start: dayjs().subtract(1, "month").startOf("month").toDate(),
                      end: dayjs().subtract(1, "month").endOf("month").toDate(),
                      preset: "previous_month",
                    },
                  })
                }
              >
                Previous Month
              </Button>
              <Button
                variant={props.config.dateRange?.preset === "custom" ? "default" : "outline"}
                size="sm"
                class="col-span-2"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    dateRange: {
                      ...props.config.dateRange!,
                      start: props.data()[0].createdAt,
                      end: props.data()[props.data().length - 1].createdAt,
                      preset: "custom",
                    },
                  })
                }
              >
                Custom Range
              </Button>
            </div>

            <Calendar
              mode="range"
              numberOfMonths={2}
              initialValue={{
                from: props.config.dateRange.start,
                to: props.config.dateRange.end,
              }}
              onValueChange={(date) => {
                if (!date.from || !date.to) return;
                props.onChange({
                  ...props.config,
                  dateRange: {
                    ...props.config.dateRange,
                    start: date.from,
                    end: date.to,
                    preset: "custom",
                  },
                });
              }}
            >
              {(api) => (
                <div class="relative w-full">
                  <Calendar.Nav
                    action="prev-month"
                    aria-label="Go to previous month"
                    as={Button}
                    size="icon"
                    class="absolute left-0 top-0"
                    variant="secondary"
                    type="button"
                  >
                    <ArrowLeft class="size-4" />
                  </Calendar.Nav>
                  <Calendar.Nav
                    action="next-month"
                    aria-label="Go to next month"
                    as={Button}
                    size="icon"
                    class="absolute right-0 top-0"
                    variant="secondary"
                    type="button"
                  >
                    <ArrowRight class="size-4" />
                  </Calendar.Nav>
                  <div class="w-full h-content flex flex-row gap-4 pt-10">
                    <Index each={api.months}>
                      {(month, index) => (
                        <div class="w-full flex flex-col gap-4">
                          <div class="flex h-8 items-center justify-center">
                            <Calendar.Label index={index} class="text-sm">
                              {formatMonth(month().month)} {month().month.getFullYear()}
                            </Calendar.Label>
                          </div>
                          <Calendar.Table index={index} class="w-full">
                            <thead>
                              <tr>
                                <Index each={api.weekdays}>
                                  {(weekday) => (
                                    <Calendar.HeadCell
                                      abbr={formatWeekdayLong(weekday())}
                                      class="w-8 flex-1 pb-1 text-sm font-normal text-muted-foreground"
                                    >
                                      {formatWeekdayShort(weekday())}
                                    </Calendar.HeadCell>
                                  )}
                                </Index>
                              </tr>
                            </thead>
                            <tbody>
                              <Index each={month().weeks}>
                                {(week) => (
                                  <tr>
                                    <Index each={week()}>
                                      {(day) => (
                                        <Calendar.Cell class="p-1 has-data-range-end:rounded-r-md has-data-range-start:rounded-l-md has-data-in-range:bg-muted/70">
                                          <Calendar.CellTrigger
                                            type="button"
                                            day={day()}
                                            month={month().month}
                                            as={Button}
                                            size="sm"
                                            variant="outline"
                                            class={cn("inline-flex w-full bg-background", {
                                              "bg-primary/10 text-primary/70": dayjs(day()).isBetween(
                                                props.config.dateRange.start,
                                                props.config.dateRange.end,
                                              ),
                                              "bg-primary text-white": dayjs().isSame(day(), "day"),
                                              "!bg-primary/50 !text-primary":
                                                dayjs(day()).isSame(props.config.dateRange.start, "day") ||
                                                dayjs(day()).isSame(props.config.dateRange.end, "day"),
                                            })}
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
              )}
            </Calendar>
          </div>
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Sort</h4>
            <div class="grid gap-2">
              <div class="grid grid-cols-2 gap-2">
                <For each={props.config.sort.variants}>
                  {(variant) => (
                    <Button
                      variant={props.config.sort.current === variant.field ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        props.onChange({
                          ...props.config,
                          sort: { ...props.config.sort, current: variant.field },
                        })
                      }
                    >
                      {variant.label}
                    </Button>
                  )}
                </For>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <Button
                  variant={props.config.sort.direction === "asc" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    props.onChange({
                      ...props.config,
                      sort: { ...props.config.sort, direction: "asc" },
                    })
                  }
                >
                  Ascending
                </Button>
                <Button
                  variant={props.config.sort.direction === "desc" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    props.onChange({
                      ...props.config,
                      sort: { ...props.config.sort, direction: "desc" },
                    })
                  }
                >
                  Descending
                </Button>
              </div>
            </div>
          </div>
          <Show when={props.config.filter.variants.length > 0}>
            <div class="space-y-2">
              <h4 class="font-medium leading-none">Filter</h4>
              <div class="grid gap-2">
                <div class="grid grid-cols-2 gap-2">
                  <For each={props.config.filter.variants}>
                    {(variant) => (
                      <Button
                        variant={props.config.filter.current === variant.type ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          props.onChange({
                            ...props.config,
                            filter: { ...props.config.filter, current: variant.type },
                          })
                        }
                      >
                        {variant.label}
                      </Button>
                    )}
                  </For>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <Button
                    variant={props.config.sort.direction === "asc" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      props.onChange({
                        ...props.config,
                        sort: { ...props.config.sort, direction: "asc" },
                      })
                    }
                  >
                    Ascending
                  </Button>
                  <Button
                    variant={props.config.sort.direction === "desc" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      props.onChange({
                        ...props.config,
                        sort: { ...props.config.sort, direction: "desc" },
                      })
                    }
                  >
                    Descending
                  </Button>
                </div>
              </div>
            </div>
          </Show>
          <Button
            variant="outline"
            onClick={() => {
              const sorted = [...props.data()].sort((a, b) => dayjs(getDate(a)).diff(dayjs(getDate(b))));
              const startDate = sorted.length === 0 ? new Date() : getDate(sorted[0]);
              const endDate = sorted.length === 0 ? new Date() : getDate(sorted[sorted.length - 1]);

              props.onChange({
                ...props.config,
                dateRange: {
                  start: startDate,
                  end: endDate,
                  preset: "clear",
                },
                search: { term: "" },
                sort: {
                  default: props.config.sort.default,
                  current: props.config.sort.default,
                  direction: "desc",
                  variants: props.config.sort.variants,
                },
                filter: {
                  default: props.config.filter.default,
                  current: props.config.filter.default,
                  variants: props.config.filter.variants,
                },
              });
            }}
          >
            Clear Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
