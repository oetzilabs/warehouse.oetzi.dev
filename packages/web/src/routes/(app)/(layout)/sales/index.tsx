import { SalesList } from "@/components/lists/sales";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getSales } from "@/lib/api/sales";
import { FilterConfig } from "@/lib/filtering";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { SaleInfo } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const sales = getSales();
    return { user, sessionToken, sales };
  },
} as RouteDefinition;

export default function SalesPage() {
  const params = useParams();
  const sales = createAsync(() => getSales(), { deferStream: true });
  const [search, setSearch] = createSignal("");
  const [dsearch, setDSearch] = createSignal("");

  const [filterConfig, setFilterConfig] = createStore<FilterConfig<SaleInfo>>({
    disabled: () => (sales() ?? []).length === 0,
    dateRange: {
      start: sales()?.length ? sales()![0].createdAt : new Date(),
      end: sales()?.length ? sales()![sales()!.length - 1].createdAt : new Date(),
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
          fn: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
        },
        // {
        //   field: "total",
        //   label: "Total",
        //   fn: (a, b) => a.total - b.total,
        // },
        {
          field: "items",
          label: "Items",
          fn: (a, b) => a.items.length - b.items.length,
        },
      ],
    },
    filter: {
      default: null,
      current: null,
      variants: [],
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

  const calculateSales = (sales: SaleInfo[]) => {
    const salesByDay = sales.reduce(
      (acc, sale) => {
        const date = dayjs(sale.createdAt).format("YYYY-MM-DD");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const sortedDates = Object.keys(salesByDay).sort((a, b) => dayjs(a).diff(dayjs(b)));
    const last30Days = sortedDates.slice(-30);

    return {
      labels: last30Days.map((d) => dayjs(d).format("MMM D")),
      datasets: [
        {
          label: "Sales per Day",
          data: last30Days.map((date) => salesByDay[date] || 0),
          fill: true,
          pointStyle: false,
          tension: 0.4,
          borderColor: "rgba(99, 102, 241, 1)",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          borderWidth: 2,
        },
      ],
      options: {
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
          },
          x: {
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
            },
          },
        },
      },
    };
  };

  return (
    <Show when={sales()}>
      {(salesList) => (
        <div class="container flex flex-col grow py-4">
          <div class="w-full flex flex-row h-full gap-4">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="font-semibold leading-none">Sales</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate(getSales.key), {
                        loading: "Refreshing sales...",
                        success: "Sales refreshed",
                        error: "Failed to refresh sales",
                      });
                    }}
                  >
                    <RotateCw class="size-4" />
                  </Button>
                  <Button size="sm" class="pl-2.5 rounded-l-none">
                    <Plus class="size-4" />
                    Create
                  </Button>
                </div>
              </div>
              <div class="flex flex-col gap-4 w-full grow">
                <div class="flex flex-col gap-4 w-full rounded-lg border h-60">
                  <div class="flex flex-col gap-4 w-full h-full p-4">
                    <LineChart data={calculateSales(salesList())} />
                  </div>
                </div>
                <SalesList data={salesList} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
