import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterConfig, WithDates, WithSimpleDates } from "@/lib/filtering";
import { type AccountingInfo } from "@warehouseoetzidev/core/src/entities/accounting";
import dayjs from "dayjs";
import quarter from "dayjs/plugin/quarterOfYear";
import { Accessor } from "solid-js";

dayjs.extend(quarter);

type AccoutingTransaction = AccountingInfo["transactions"][number];

type AccountingFilterPopoverProps<T extends WithSimpleDates & AccoutingTransaction> = {
  config: FilterConfig<T>;
  onChange: (config: FilterConfig<T>) => void;
  data: Accessor<T[]>;
};

export const AccountingFilterPopover = <T extends WithSimpleDates & AccoutingTransaction>(
  props: AccountingFilterPopoverProps<T>,
) => {
  return (
    <Popover placement="bottom-end">
      <PopoverTrigger as={Button} size="lg" disabled={props.config.disabled()} class="h-10 px-5">
        Financial Filters
      </PopoverTrigger>
      <PopoverContent class="w-[320px]">
        <div class="grid gap-4">
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Financial Period</h4>
            <div class="grid gap-2">
              <Button
                variant={props.config.dateRange?.preset === "start_of_quarter" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    dateRange: {
                      ...props.config.dateRange!,
                      start: dayjs().startOf("quarter").toDate(),
                      end: dayjs().endOf("quarter").toDate(),
                      preset: "start_of_quarter",
                    },
                  })
                }
              >
                This Quarter
              </Button>
              <Button
                variant={props.config.dateRange?.preset === "last_quarter" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    dateRange: {
                      ...props.config.dateRange!,
                      start: dayjs().subtract(1, "quarter").startOf("quarter").toDate(),
                      end: dayjs().subtract(1, "quarter").endOf("quarter").toDate(),
                      preset: "last_quarter",
                    },
                  })
                }
              >
                Last Quarter
              </Button>
              <Button
                variant={props.config.dateRange?.preset === "start_of_year" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    dateRange: {
                      ...props.config.dateRange!,
                      start: dayjs().startOf("year").toDate(),
                      end: dayjs().endOf("year").toDate(),
                      preset: "start_of_year",
                    },
                  })
                }
              >
                This Year
              </Button>
              <Button
                variant={props.config.dateRange?.preset === "previous_year" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    dateRange: {
                      ...props.config.dateRange!,
                      start: dayjs().subtract(1, "year").startOf("year").toDate(),
                      end: dayjs().subtract(1, "year").endOf("year").toDate(),
                      preset: "previous_year",
                    },
                  })
                }
              >
                Last Year
              </Button>
            </div>
          </div>
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Transaction Type</h4>
            <div class="grid grid-cols-2 gap-2">
              <Button
                variant={props.config.sort.current === "income" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    sort: { ...props.config.sort, current: "income" },
                  })
                }
              >
                Income
              </Button>
              <Button
                variant={props.config.sort.current === "expense" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  props.onChange({
                    ...props.config,
                    sort: { ...props.config.sort, current: "expense" },
                  })
                }
              >
                Expenses
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              props.onChange({
                disabled: () => props.data().length === 0,
                dateRange: {
                  start: dayjs().startOf("year").toDate(),
                  end: dayjs().endOf("year").toDate(),
                  preset: "start_of_year",
                },
                search: { term: "" },
                sort: {
                  default: "all",
                  current: "all",
                  direction: "desc",
                  variants: [
                    { field: "all", label: "All", fn: (a, b) => a.date.getTime() - b.date.getTime() },
                    { field: "income", label: "Income", fn: (a, b) => a.amounts[0].amount - b.amounts[0].amount },
                    { field: "expense", label: "Expenses", fn: (a, b) => a.amounts[0].amount - b.amounts[0].amount },
                  ],
                },
              });
            }}
          >
            Reset Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
