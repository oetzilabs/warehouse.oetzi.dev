import { AccountingFilterPopover } from "@/components/lists/accounting/filter-popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { FilterConfig, useSimpleDateFilter } from "@/lib/filtering";
import { cn } from "@/lib/utils";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { type AccountingInfo } from "@warehouseoetzidev/core/src/entities/accounting";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Accessor, createSignal, For, mergeProps, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";

dayjs.extend(localizedFormat);

type AccoutingTransaction = AccountingInfo["transactions"][number];

type AccountingListProps = {
  data: Accessor<AccoutingTransaction[]>;
};

// Helper: summarize transactions by day
function summarizeTransactionsByDay(transactions: AccoutingTransaction[]) {
  const grouped: Record<string, AccoutingTransaction> = {};

  for (const tx of transactions) {
    const day = dayjs(tx.date).format("YYYY-MM-DD");
    if (!grouped[day]) {
      grouped[day] = {
        ...tx,
        // We'll merge amounts and types below
        amounts: [...tx.amounts],
        // If multiple types, mark as "mixed"
        type: tx.type,
      };
    } else {
      grouped[day].amounts = grouped[day].amounts.concat(tx.amounts);
      // If types differ, set to "mixed"
      if (grouped[day].type !== tx.type) {
        grouped[day].type = "mixed";
      }
    }
  }

  // Sort by date descending (latest first)
  return Object.values(grouped).sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());
}

export const AccountingList = (props: AccountingListProps) => {
  const [filterConfig, setFilterConfig] = createStore<FilterConfig<AccoutingTransaction>>({
    disabled: () => props.data().length === 0,
    dateRange: {
      start: props.data().length === 0 ? new Date() : (props.data()[0]?.date ?? new Date()),
      end: props.data().length === 0 ? new Date() : (props.data()[props.data().length - 1]?.date ?? new Date()),
      preset: "clear",
    },
    search: { term: "" },
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
    filter: {
      default: null,
      current: null,
      variants: [],
    },
  });

  const filteredData = useSimpleDateFilter(props.data, filterConfig);

  const [zoneInfo, setZoneInfo] = createSignal("en-US");
  onMount(() => {
    setZoneInfo(navigator.userLanguage ?? navigator.languages[0] ?? navigator.language);
  });

  // Use summarized data for rendering
  const summarizedData = () => summarizeTransactionsByDay(filteredData());

  return (
    <div class="w-full flex flex-col gap-4">
      <div class="border rounded-lg overflow-clip">
        <Table class="table-auto">
          <TableHeader class="py-4 !h-auto">
            <TableRow>
              <TableHead class="w-[120px] p-4 h-content">Date</TableHead>
              <TableHead class="w-[50px] h-content p-4 hidden md:table-cell">Type</TableHead>
              <TableHead class="p-4 h-content">Products</TableHead>
              <TableHead class="text-right p-4 h-content">Amounts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For
              each={summarizedData()}
              fallback={
                <TableRow>
                  <TableCell colspan="5" class="text-center text-muted-foreground py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              }
            >
              {(acc) => (
                <TableRow>
                  <TableCell class="font-medium px-4 align-top text-left py-4">
                    <div title={dayjs(acc.date).format("LL")} class="flex flex-col w-max">
                      <span>{dayjs(acc.date).format("LL")}</span>
                    </div>
                  </TableCell>
                  <TableCell class="align-top hidden md:table-cell py-4">
                    <div class="flex flex-col">
                      <span
                        class={cn("text-sm font-medium uppercase", {
                          "text-emerald-500 dark:text-emerald-400": acc.type === "income",
                          "text-rose-500 dark:text-rose-400": acc.type === "expense",
                          "text-amber-500 dark:text-amber-400": acc.type === "mixed",
                        })}
                      >
                        {acc.type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell class="align-top py-4">
                    <div class="flex flex-col text-sm w-max">
                      <Show when={acc.amounts.filter((c) => c.type === "expense")}>
                        {(expenses) => <span class="text-muted-foreground">Bought: {expenses().length}</span>}
                      </Show>
                      <Show when={acc.amounts.filter((c) => c.type === "income")}>
                        {(incomes) => <span class="text-muted-foreground">Sold: {incomes().length}</span>}
                      </Show>
                    </div>
                  </TableCell>
                  <TableCell class="text-right px-4 py-4">
                    <div class="flex flex-col gap-2 items-end justify-end">
                      <For
                        each={[
                          {
                            type: "income",
                            label: "+",
                            color: "text-emerald-500 dark:text-emerald-400",
                            storno: "text-rose-500 dark:text-rose-400",
                          },
                          {
                            type: "expense",
                            label: "-",
                            color: "text-rose-500 dark:text-rose-400",
                            storno: "text-muted-foreground",
                          },
                        ]}
                      >
                        {(rowType) => {
                          const filtered = acc.amounts.filter((a) => a.type === rowType.type && a.value.amount >= 0);
                          const storno = acc.amounts.filter((a) => a.type === rowType.type && a.value.amount < 0);

                          // Group by currency for totals
                          const sumByCurrency = (arr: typeof filtered) =>
                            arr.reduce(
                              (acc, curr) => {
                                acc[curr.value.currency] = (acc[curr.value.currency] || 0) + curr.value.amount;
                                return acc;
                              },
                              {} as Record<string, number>,
                            );

                          const filteredTotals = sumByCurrency(filtered);
                          const stornoTotals = sumByCurrency(storno);

                          return (
                            <>
                              <Show when={Object.keys(filteredTotals).length > 0}>
                                <span class={`text-sm font-medium leading-none ${rowType.color} w-max text-right`}>
                                  {rowType.label}
                                  {Object.entries(filteredTotals)
                                    .map(([currency, total]) =>
                                      Intl.NumberFormat(zoneInfo(), {
                                        style: "currency",
                                        currency,
                                        minimumFractionDigits: 2,
                                      }).format(total),
                                    )
                                    .join(" ")}
                                </span>
                              </Show>
                              <Show when={Object.keys(stornoTotals).length > 0}>
                                <span class={`text-sm font-medium leading-none ${rowType.storno} w-max text-right`}>
                                  {rowType.type === "income" ? "Storno: -" : "Supplier Storno: "}
                                  {Object.entries(stornoTotals)
                                    .map(([currency, total]) =>
                                      Intl.NumberFormat(zoneInfo(), {
                                        style: "currency",
                                        currency,
                                        minimumFractionDigits: 2,
                                      }).format(Math.abs(total)),
                                    )
                                    .join(" ")}
                                </span>
                              </Show>
                            </>
                          );
                        }}
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
