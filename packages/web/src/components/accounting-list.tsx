import { Button } from "@/components/ui/button";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useFilter, useSimpleDateFilter } from "@/lib/filtering";
import { cn } from "@/lib/utils";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { A } from "@solidjs/router";
import { type AccountingInfo } from "@warehouseoetzidev/core/src/entities/accounting";
import dayjs from "dayjs";
import Minus from "lucide-solid/icons/minus";
import Plus from "lucide-solid/icons/plus";
import { Accessor, createSignal, For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { AccountingFilterPopover } from "./accounting-filter-popover";

type AccoutingTransaction = AccountingInfo["transactions"][number];

type AccountingListProps = {
  data: Accessor<AccoutingTransaction[]>;
};

export const AccountingList = (props: AccountingListProps) => {
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<AccoutingTransaction>>({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : (props.data()[0]?.date ?? new Date()),
      end: props.data().length === 0 ? new Date() : (props.data()[props.data().length - 1]?.date ?? new Date()),
      preset: "clear",
    },
    search: { term: dsearch() },
    sort: {
      default: "name",
      current: "name",
      direction: "desc",
      variants: [
        {
          field: "date",
          label: "Date",
          fn: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
        },
        {
          field: "description",
          label: "Description",
          fn: (a, b) => a.description.localeCompare(b.description),
        },
        {
          field: "income",
          label: "Income",
          fn: (a, b) => a.amounts[0].amount - b.amounts[0].amount,
        },
        {
          field: "expense",
          label: "Expenses",
          fn: (a, b) => a.amounts[0].amount - b.amounts[0].amount,
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

  const filteredData = useSimpleDateFilter(props.data, filterConfig);

  const [zoneInfo, setZoneInfo] = createSignal("en-US");
  onMount(() => {
    setZoneInfo(navigator.userLanguage ?? navigator.languages[0] ?? navigator.language);
  });

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
          <TextFieldInput placeholder="Search products" class="w-full max-w-full rounded-lg px-4" />
        </TextField>
        <div class="w-max">
          <AccountingFilterPopover config={filterConfig} onChange={setFilterConfig} data={props.data} />
        </div>
      </div>
      <div class="overflow-clip border rounded-lg">
        <For
          each={filteredData()}
          fallback={
            <div class="flex flex-col gap-4 items-center justify-center rounded-lg p-14 border text-muted-foreground">
              <span class="text-sm select-none">No sales/orders have been made</span>
            </div>
          }
        >
          {(acc) => (
            <div class={cn("flex flex-col gap-4 w-full h-content p-4 border-b last:border-b-0 h-auto cursor-default")}>
              <div class="flex flex-row items-center gap-4 justify-between w-full h-content">
                <div class="flex flex-row items-center gap-4">
                  <div class="flex flex-row gap-4 items-center justify-start">
                    <div
                      class={cn(
                        "text-xs font-medium leading-none size-6 rounded-full flex flex-row items-center gap-1 justify-center border",
                        {
                          "text-emerald-500 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-800 border-emerald-300 dark:border-emerald-700":
                            acc.type === "income",
                          "text-rose-500 bg-rose-100 dark:text-rose-400 dark:bg-rose-800 border-rose-300 dark:border-rose-700":
                            acc.type === "expense",
                        },
                      )}
                    >
                      <Show when={acc.type === "income"} fallback={<Minus class="size-4" />}>
                        <Plus class="size-4" />
                      </Show>
                      {/* <span>{acc.type}</span> */}
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 w-full">
                    <span class="text-xs font-medium leading-none">{dayjs(acc.date).format("MMM DD, YYYY")}</span>
                  </div>
                </div>
                <div class="flex flex-row gap-2 items-center justify-start">
                  <For each={acc.amounts}>
                    {(amount) => (
                      <span class="text-sm text-current font-medium">
                        {Intl.NumberFormat(zoneInfo(), {
                          style: "currency",
                          currency: amount.currency,
                          minimumFractionDigits: 2,
                        }).format(amount.amount)}
                      </span>
                    )}
                  </For>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
