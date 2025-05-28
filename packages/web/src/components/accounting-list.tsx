import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import "@fontsource-variable/geist-mono";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(localizedFormat);

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
      default: "date",
      current: "date",
      direction: "desc",
      variants: [
        {
          field: "date",
          label: "Date",
          fn: (a, b) => dayjs(b.date).unix() - dayjs(a.date).unix(),
        },
        {
          field: "description",
          label: "Description",
          fn: (a, b) => a.description.localeCompare(b.description),
        },
        {
          field: "income",
          label: "Income",
          fn: (a, b) => (a.type === "income" ? 1 : b.type === "income" ? -1 : 0),
        },
        {
          field: "expense",
          label: "Expenses",
          fn: (a, b) => (a.type === "expense" ? 1 : b.type === "expense" ? -1 : 0),
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
      <div class="border rounded-lg overflow-clip">
        <Table class="table-auto">
          <TableHeader class="py-4 !h-auto">
            <TableRow>
              <TableHead class="w-[120px] p-4 h-content">Date</TableHead>
              <TableHead class="w-[50px] h-content p-4 ">Type</TableHead>
              <TableHead class="p-4 h-content">Description</TableHead>
              <TableHead class="text-right p-4 h-content">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For
              each={filteredData()}
              fallback={
                <TableRow>
                  <TableCell colspan="4" class="text-center text-muted-foreground py-8">
                    No sales/orders have been made
                  </TableCell>
                </TableRow>
              }
            >
              {(acc) => (
                <TableRow>
                  <TableCell class="font-medium px-4">
                    <div title={dayjs(acc.date).format("LLL")} class="w-max">
                      {dayjs(acc.date).format("LL")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      class={cn("text-xs font-medium leading-none", {
                        "text-emerald-500 dark:text-emerald-400": acc.type === "income",
                        "text-rose-500 dark:text-rose-400": acc.type === "expense",
                      })}
                    >
                      {acc.type}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="flex flex-col gap-1">
                      <span>{acc.description}</span>
                      <span class="text-xs text-muted-foreground">
                        {acc.type === "income" ? "Sold" : "Purchased"} {acc.productAmounts} products
                      </span>
                    </div>
                  </TableCell>
                  <TableCell class="text-right px-4">
                    <div class="flex flex-row gap-2 items-center justify-end">
                      <For each={acc.amounts}>
                        {(amount) => (
                          <span
                            class={cn("text-sm font-medium leading-none font-['Geist_Mono_Variable']", {
                              "text-emerald-500 dark:text-emerald-400": acc.type === "income",
                              "text-rose-500 dark:text-rose-400": acc.type === "expense",
                            })}
                          >
                            {acc.type === "income" ? "+" : "-"}{" "}
                            {Intl.NumberFormat(zoneInfo(), {
                              style: "currency",
                              currency: amount.currency,
                              minimumFractionDigits: 2,
                            }).format(amount.amount)}
                          </span>
                        )}
                      </For>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
