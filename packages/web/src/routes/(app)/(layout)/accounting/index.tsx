import { AccountingList } from "@/components/accounting-list";
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
import "@fontsource-variable/geist-mono";
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
    const dailyStats = accounting.transactions.reduce(
      (acc, transaction) => {
        const date = dayjs(transaction.date).format("YYYY-MM-DD");

        transaction.amounts.forEach(({ bought, sold, currency }) => {
          if (!acc[currency]) {
            acc[currency] = {};
          }
          if (!acc[currency][date]) {
            acc[currency][date] = { income: 0, expenses: 0 };
          }

          acc[currency][date].income += sold;
          acc[currency][date].expenses += bought;
        });

        return acc;
      },
      {} as Record<string, Record<string, { income: number; expenses: number }>>,
    );

    // Convert to chart datasets
    const allDates = [
      ...new Set(Object.values(dailyStats).flatMap((currencyData) => Object.keys(currencyData))),
    ].sort();

    return {
      labels: allDates,
      datasets: Object.entries(dailyStats).flatMap(([currency, data]) => [
        {
          label: `Income (${currency})`,
          data: allDates.map((date) => data[date]?.income ?? 0),
          fill: true,
          pointStyle: false,
          borderColor: "rgb(34, 197, 94)", // Consistent green for income
          backgroundColor: "rgba(34, 197, 94, 0.1)",
        },
        {
          label: `Expenses (${currency})`,
          data: allDates.map((date) => data[date]?.expenses ?? 0),
          fill: true,
          pointStyle: false,
          borderColor: "rgb(239, 68, 68)", // Consistent red for expenses
          backgroundColor: "rgba(239, 68, 68, 0.1)",
        },
      ]),
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
