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
              <TableHead class="w-[50px] h-content p-4">Type</TableHead>
              <TableHead class="p-4 h-content">Products</TableHead>
              <TableHead class="text-right p-4 h-content">Amounts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For
              each={filteredData()}
              fallback={
                <TableRow>
                  <TableCell colspan="4" class="text-center text-muted-foreground py-8">
                    No transactions found
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
                        "text-amber-500 dark:text-amber-400": acc.type === "mixed",
                      })}
                    >
                      {acc.type}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="flex flex-col gap-1 py-2">
                      <div class="flex flex-col text-xs">
                        <Show when={acc.productAmounts.bought > 0}>
                          <span class="text-rose-500 dark:text-rose-400">
                            Bought: {acc.productAmounts.bought} products
                          </span>
                        </Show>
                        <Show when={acc.productAmounts.sold > 0}>
                          <span class="text-emerald-500 dark:text-emerald-400">
                            Sold: {acc.productAmounts.sold} products
                          </span>
                        </Show>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell class="text-right px-4">
                    <div class="flex flex-col gap-2 items-end justify-end">
                      <For each={acc.amounts}>
                        {(amount) => (
                          <div class="flex flex-col gap-1 font-['Geist_Mono_Variable']">
                            <Show when={amount.bought > 0}>
                              <span class="text-sm font-medium leading-none text-rose-500 dark:text-rose-400">
                                -{" "}
                                {Intl.NumberFormat(zoneInfo(), {
                                  style: "currency",
                                  currency: amount.currency,
                                  minimumFractionDigits: 2,
                                }).format(amount.bought)}
                              </span>
                            </Show>
                            <Show when={amount.sold > 0}>
                              <span class="text-sm font-medium leading-none text-emerald-500 dark:text-emerald-400">
                                +{" "}
                                {Intl.NumberFormat(zoneInfo(), {
                                  style: "currency",
                                  currency: amount.currency,
                                  minimumFractionDigits: 2,
                                }).format(amount.sold)}
                              </span>
                            </Show>
                          </div>
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
