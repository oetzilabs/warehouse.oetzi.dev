import { Button } from "@/components/ui/button";
import {
  DatePicker,
  DatePickerContent,
  DatePickerContext,
  DatePickerControl,
  DatePickerInput,
  DatePickerNextTrigger,
  DatePickerPositioner,
  DatePickerPrevTrigger,
  DatePickerRangeText,
  DatePickerTable,
  DatePickerTableBody,
  DatePickerTableCell,
  DatePickerTableCellTrigger,
  DatePickerTableHead,
  DatePickerTableHeader,
  DatePickerTableRow,
  DatePickerTrigger,
  DatePickerView,
  DatePickerViewControl,
  DatePickerViewTrigger,
} from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterConfig, WithDates } from "@/lib/filtering";
import { CalendarDate } from "@internationalized/date";
import dayjs from "dayjs";
import { Accessor, createMemo, Index } from "solid-js";
import { Portal } from "solid-js/web";

type FilterPopoverProps<T extends WithDates> = {
  config: FilterConfig<T>;
  onChange: (config: FilterConfig<T>) => void;
  data: Accessor<T[]>;
};

export const FilterPopover = <T extends WithDates>(props: FilterPopoverProps<T>) => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatDateToCalendarDate = (date: Date) => {
    return new CalendarDate(
      date.getFullYear(),
      date.getMonth() + 1, // months are 1-based in CalendarDate
      date.getDate(),
    );
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger as={Button} size="sm" disabled={props.config.disabled()} class="h-10 rounded-lg">
        Filters & Sort
      </PopoverTrigger>
      <PopoverContent class="w-[420px]">
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
            <DatePicker
              numOfMonths={2}
              selectionMode="range"
              format={(e) => {
                const parsedDate = new Date(Date.parse(e.toString()));
                const normalizedDate = new Date(
                  parsedDate.getUTCFullYear(),
                  parsedDate.getUTCMonth(),
                  parsedDate.getUTCDate(),
                );
                return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(normalizedDate);
              }}
              value={[
                formatDateToCalendarDate(props.config.dateRange.start),
                formatDateToCalendarDate(props.config.dateRange.end),
              ]}
              onValueChange={(change) => {
                if (!change?.value) return;
                props.onChange({
                  ...props.config,
                  dateRange: {
                    ...props.config.dateRange!,
                    start: change.value[0].toDate(timezone),
                    end: change.value[1].toDate(timezone),
                  },
                });
              }}
            >
              <DatePickerControl>
                <DatePickerInput index={0} placeholder="Start date" />
                <DatePickerInput index={1} placeholder="End date" />
                <DatePickerTrigger />
              </DatePickerControl>
              <Portal>
                <DatePickerPositioner>
                  <DatePickerContent class="shadow-none">
                    <DatePickerView view="day">
                      <DatePickerContext>
                        {(api) => {
                          const offset = createMemo(() => api().getOffset({ months: 1 }));
                          return (
                            <>
                              <DatePickerViewControl>
                                <DatePickerPrevTrigger />
                                <DatePickerViewTrigger>
                                  <DatePickerRangeText />
                                </DatePickerViewTrigger>
                                <DatePickerNextTrigger />
                              </DatePickerViewControl>
                              <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <DatePickerTable>
                                  <DatePickerTableHead>
                                    <DatePickerTableRow>
                                      <Index each={api().weekDays}>
                                        {(weekDay) => <DatePickerTableHeader>{weekDay().short}</DatePickerTableHeader>}
                                      </Index>
                                    </DatePickerTableRow>
                                  </DatePickerTableHead>
                                  <DatePickerTableBody>
                                    <Index each={api().weeks}>
                                      {(week) => (
                                        <DatePickerTableRow>
                                          <Index each={week()}>
                                            {(day) => (
                                              <DatePickerTableCell value={day()}>
                                                <DatePickerTableCellTrigger>{day().day}</DatePickerTableCellTrigger>
                                              </DatePickerTableCell>
                                            )}
                                          </Index>
                                        </DatePickerTableRow>
                                      )}
                                    </Index>
                                  </DatePickerTableBody>
                                </DatePickerTable>
                                <DatePickerTable>
                                  <DatePickerTableHead>
                                    <DatePickerTableRow>
                                      <Index each={api().weekDays}>
                                        {(weekDay) => <DatePickerTableHeader>{weekDay().short}</DatePickerTableHeader>}
                                      </Index>
                                    </DatePickerTableRow>
                                  </DatePickerTableHead>
                                  <DatePickerTableBody>
                                    <Index each={offset().weeks}>
                                      {(week) => (
                                        <DatePickerTableRow>
                                          <Index each={week()}>
                                            {(day) => (
                                              <DatePickerTableCell value={day()} visibleRange={offset().visibleRange}>
                                                <DatePickerTableCellTrigger>{day().day}</DatePickerTableCellTrigger>
                                              </DatePickerTableCell>
                                            )}
                                          </Index>
                                        </DatePickerTableRow>
                                      )}
                                    </Index>
                                  </DatePickerTableBody>
                                </DatePickerTable>
                              </div>
                            </>
                          );
                        }}
                      </DatePickerContext>
                    </DatePickerView>
                    <DatePickerView view="month">
                      <DatePickerContext>
                        {(api) => (
                          <>
                            <DatePickerViewControl>
                              <DatePickerPrevTrigger />
                              <DatePickerViewTrigger>
                                <DatePickerRangeText />
                              </DatePickerViewTrigger>
                              <DatePickerNextTrigger />
                            </DatePickerViewControl>
                            <DatePickerTable>
                              <DatePickerTableBody>
                                <Index each={api().getMonthsGrid({ columns: 4, format: "short" })}>
                                  {(months) => (
                                    <DatePickerTableRow>
                                      <Index each={months()}>
                                        {(month) => (
                                          <DatePickerTableCell value={month().value}>
                                            <DatePickerTableCellTrigger>{month().label}</DatePickerTableCellTrigger>
                                          </DatePickerTableCell>
                                        )}
                                      </Index>
                                    </DatePickerTableRow>
                                  )}
                                </Index>
                              </DatePickerTableBody>
                            </DatePickerTable>
                          </>
                        )}
                      </DatePickerContext>
                    </DatePickerView>
                    <DatePickerView view="year">
                      <DatePickerContext>
                        {(api) => (
                          <>
                            <DatePickerViewControl>
                              <DatePickerPrevTrigger />
                              <DatePickerViewTrigger>
                                <DatePickerRangeText />
                              </DatePickerViewTrigger>
                              <DatePickerNextTrigger />
                            </DatePickerViewControl>
                            <DatePickerTable>
                              <DatePickerTableBody>
                                <Index each={api().getYearsGrid({ columns: 4 })}>
                                  {(years) => (
                                    <DatePickerTableRow>
                                      <Index each={years()}>
                                        {(year) => (
                                          <DatePickerTableCell value={year().value}>
                                            <DatePickerTableCellTrigger>{year().label}</DatePickerTableCellTrigger>
                                          </DatePickerTableCell>
                                        )}
                                      </Index>
                                    </DatePickerTableRow>
                                  )}
                                </Index>
                              </DatePickerTableBody>
                            </DatePickerTable>
                          </>
                        )}
                      </DatePickerContext>
                    </DatePickerView>
                  </DatePickerContent>
                </DatePickerPositioner>
              </Portal>
            </DatePicker>
          </div>
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Sort</h4>
            <div class="grid gap-2">
              <div class="grid grid-cols-2 gap-2">
                {props.config.sort.variants.map((variant) => (
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
                ))}
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
          <Button
            variant="outline"
            onClick={() => {
              props.onChange({
                disabled: () => props.data().length === 0,
                dateRange: {
                  start: props.data().length === 0 ? new Date() : props.data()[0].createdAt,
                  end: props.data().length === 0 ? new Date() : props.data()[props.data().length - 1].createdAt,
                  preset: "clear",
                },
                search: { term: "" },
                sort: {
                  default: props.config.sort.default,
                  current: props.config.sort.default,
                  direction: "desc",
                  variants: props.config.sort.variants,
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
