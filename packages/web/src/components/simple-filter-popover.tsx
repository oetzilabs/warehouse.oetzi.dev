import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterConfig, WithSimpleDates } from "@/lib/filtering";
import dayjs from "dayjs";
import { Accessor } from "solid-js";

type SimpleFilterPopoverProps<T extends WithSimpleDates> = {
  config: FilterConfig<T>;
  onChange: (config: FilterConfig<T>) => void;
  data: Accessor<T[]>;
};

export const SimpleFilterPopover = <T extends WithSimpleDates>(props: SimpleFilterPopoverProps<T>) => {
  return (
    <Popover placement="bottom-end">
      <PopoverTrigger as={Button} size="lg" disabled={props.config.disabled()} class="h-10 px-5">
        Simple Filters & Sort
      </PopoverTrigger>
      <PopoverContent class="w-[320px]">
        <div class="grid gap-4">
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Quick Date Range</h4>
            <div class="grid gap-2">
              <Button
                variant={props.config.dateRange?.preset === "today" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    dateRange: {
                      ...props.config.dateRange!,
                      start: dayjs().startOf("day").toDate(),
                      end: dayjs().endOf("day").toDate(),
                      preset: "today",
                    },
                  })
                }
              >
                Today
              </Button>
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
                This Week
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
                This Month
              </Button>
            </div>
          </div>
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Sort</h4>
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
          <Button
            variant="outline"
            onClick={() => {
              props.onChange({
                disabled: () => props.data().length === 0,
                dateRange: {
                  start: props.data().length === 0 ? new Date() : props.data()[0].date,
                  end: props.data().length === 0 ? new Date() : props.data()[props.data().length - 1].date,
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
