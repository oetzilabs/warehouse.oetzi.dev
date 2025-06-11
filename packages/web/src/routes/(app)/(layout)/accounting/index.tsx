import { AccountingList } from "@/components/lists/accounting";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAccountingList } from "@/lib/api/accounting";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import { AccountingInfo } from "@warehouseoetzidev/core/src/entities/accounting";
import dayjs from "dayjs";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createSignal, For, onMount, Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const start = dayjs().startOf("month").toDate();
    const end = dayjs().endOf("month").toDate();
    const accounting = getAccountingList();
    return { user, sessionToken, accounting };
  },
} as RouteDefinition;

export default function AccountingPage() {
  const start = dayjs().startOf("month").toDate();
  const end = dayjs().endOf("month").toDate();
  const accounting = createAsync(() => getAccountingList(), { deferStream: true });

  const calculateAccountingStats = (accounting: AccountingInfo) => {
    if (!accounting?.transactions?.length) {
      return {
        labels: [],
        datasets: [
          {
            label: "No transactions",
            data: [],
            fill: true,
            pointStyle: false,
            borderColor: "rgb(156, 163, 175)",
          },
        ],
      };
    }

    // Sort transactions by date first
    const sortedTransactions = [...accounting.transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const dailyStats = sortedTransactions.reduce(
      (acc, transaction) => {
        const date = dayjs(transaction.date).format("YYYY-MM-DD");

        transaction.amounts.forEach(({ bought, sold, currency }) => {
          if (!acc[currency]) {
            acc[currency] = {};
          }
          if (!acc[currency][date]) {
            // Find the last known total for this currency
            const previousDates = Object.keys(acc[currency]).sort();
            const lastTotal =
              previousDates.length > 0 ? acc[currency][previousDates[previousDates.length - 1]].total : 0;

            acc[currency][date] = { total: lastTotal };
          }

          // Add today's transactions to the running total
          acc[currency][date].total += sold - bought;
        });

        return acc;
      },
      {} as Record<string, Record<string, { total: number }>>,
    );

    // Get all unique dates and sort them
    const allDates = [
      ...new Set(Object.values(dailyStats).flatMap((currencyData) => Object.keys(currencyData))),
    ].sort();

    // Fill in missing dates with the last known total
    Object.entries(dailyStats).forEach(([currency, data]) => {
      let lastTotal = 0;
      allDates.forEach((date) => {
        if (!data[date]) {
          data[date] = { total: lastTotal };
        } else {
          lastTotal = data[date].total;
        }
      });
    });

    return {
      labels: allDates,
      datasets: Object.entries(dailyStats).map(([currency, data]) => ({
        label: currency,
        data: allDates.map((date) => data[date]?.total ?? 0),
        fill: true,
        pointStyle: false,
        borderColor:
          currency === "EUR" ? "rgb(34, 197, 94)" : currency === "USD" ? "rgb(59, 130, 246)" : "rgb(156, 163, 175)",
        backgroundColor:
          currency === "EUR"
            ? "rgba(34, 197, 94, 0.1)"
            : currency === "USD"
              ? "rgba(59, 130, 246, 0.1)"
              : "rgba(156, 163, 175, 0.1)",
      })),
      options: {
        scales: {
          x: {
            display: false, // This will hide the x-axis labels
          },
        },
      },
    };
  };

  const [zoneInfo, setZoneInfo] = createSignal("en-US");
  onMount(() => {
    setZoneInfo(navigator.userLanguage ?? navigator.languages[0] ?? navigator.language);
  });

  return (
    <Show when={accounting()}>
      {(accountingList) => (
        <div class="container flex flex-col grow py-4">
          <div class="w-full flex flex-row h-full">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="font-semibold leading-none">Accounting</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      toast.promise(revalidate(getAccountingList.key), {
                        loading: "Refreshing accounting...",
                        success: "Accounting refreshed",
                        error: "Failed to refresh accounting",
                      });
                    }}
                  >
                    <RotateCw class="size-4" />
                    Refresh
                  </Button>
                </div>
              </div>
              <div class="flex flex-col gap-4 w-full grow">
                <div class="flex flex-col gap-2 w-full">
                  <div class="flex flex-col gap-2 w-full rounded-lg border h-60">
                    <div class="flex flex-col gap-2 w-full h-full p-4">
                      <LineChart data={calculateAccountingStats(accountingList())} />
                    </div>
                  </div>
                </div>
                <AccountingList data={() => accountingList().transactions} />
                <div class="flex flex-col items-start justify-start gap-4 border rounded-lg overflow-clip">
                  <Table class="table-auto">
                    <TableHeader>
                      <TableRow>
                        <TableHead class="w-full p-4 h-auto">Currency</TableHead>
                        <TableHead class="text-right p-4 h-auto">Income</TableHead>
                        <TableHead class="text-right p-4 h-auto">Expenses</TableHead>
                        <TableHead class="text-right p-4 h-auto hidden md:table-cell">Stornos</TableHead>
                        <TableHead class="text-right w-content p-4 h-auto">
                          <div class="flex flex-row items-end justify-end gap-0 w-max">
                            <span>Net Total</span>
                            <span class="inline-block md:hidden">*</span>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <For each={Object.entries(accountingList().totalsByCurrency)}>
                        {([currency, values]) => (
                          <TableRow class="border-b-0 font-['Geist_Mono_Variable']">
                            <TableCell class="font-semibold p-4 h-auto">{currency}</TableCell>
                            <TableCell class="text-right p-4 h-auto">
                              <div class="flex flex-row gap-2 items-baseline justify-end">
                                <span class="text-emerald-500">{values.income.toFixed(2)}</span>
                                {/* <span class="text-xs text-muted-foreground">({values.uniqueProductsIncome}x)</span> */}
                              </div>
                            </TableCell>
                            <TableCell class="text-right p-4 h-auto">
                              <div class="flex flex-row gap-2 items-baseline justify-end">
                                <span class="text-rose-500">{values.expenses.toFixed(2)}</span>
                                {/* <span class="text-xs text-muted-foreground">({values.uniqueProductsExpenses}x)</span> */}
                              </div>
                            </TableCell>
                            <TableCell class="text-right p-4 h-auto hidden md:table-cell">
                              <div class="flex flex-row gap-2 items-baseline justify-end">
                                <span class="text-rose-300 text-sm">{values.stornos.income.toFixed(2)}*</span>
                                <span class="text-muted-foreground text-sm">
                                  {values.stornos.expenses.toFixed(2)}**
                                </span>
                              </div>
                            </TableCell>
                            <TableCell class="text-right p-4 h-auto font-bold">
                              <div class="flex flex-row gap-2 items-baseline justify-end">
                                <span
                                  class={cn({
                                    "text-emerald-500": values.netIncome > 0,
                                    "text-rose-500": values.netIncome < 0,
                                    "text-muted-foreground": values.netIncome === 0,
                                  })}
                                >
                                  {values.netIncome.toFixed(2)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </For>
                    </TableBody>
                  </Table>
                </div>
                <div class="flex flex-col gap-1 items-end justify-start px-4">
                  <div class="hidden md:flex flex-col gap-1 items-end justify-start px-4">
                    <span class="text-xs text-muted-foreground text-right">
                      * Storno: Income that is subtracted from the income total
                    </span>
                    <span class="text-xs text-muted-foreground text-right">
                      ** Supplier Storno: Expenses that are subtracted from the expenses total
                    </span>
                  </div>
                  <div class="flex flex-col gap-1 items-end justify-start px-4 md:hidden">
                    <span class="text-xs text-muted-foreground text-right">
                      * Storno and Supplier Storne has been subtracted from the totals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
