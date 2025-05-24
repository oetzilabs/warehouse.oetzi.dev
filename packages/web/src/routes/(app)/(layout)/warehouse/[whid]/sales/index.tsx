import { FilterPopover } from "@/components/filter-popover";
import { SalesList } from "@/components/sales-list";
import { SalesDataTable } from "@/components/sales/sales-data-table";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getSalesByWarehouseId } from "@/lib/api/sales";
import { FilterConfig, useFilter } from "@/lib/filtering";
import { cn } from "@/lib/utils";
import { debounce, leadingAndTrailing } from "@solid-primitives/scheduled";
import { createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { SaleInfo } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import PackageSearch from "lucide-solid/icons/package-search";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import X from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { createStore } from "solid-js/store";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const sales = getSalesByWarehouseId(props.params.whid);
    return { user, sessionToken, sales };
  },
} as RouteDefinition;

export default function SalesPage() {
  const params = useParams();
  const sales = createAsync(() => getSalesByWarehouseId(params.whid), { deferStream: true });
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
        {
          field: "total",
          label: "Total",
          fn: (a, b) => a.total - b.total,
        },
        {
          field: "items",
          label: "Items",
          fn: (a, b) => a.items.length - b.items.length,
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

  const calculateSales = (sales: SaleInfo[]) => {
    // Calculate total sales for each day
    const totalSales = sales.reduce(
      (acc, sale) => {
        const date = dayjs(sale.createdAt).format("YYYY-MM-DD");
        if (acc[date]) {
          acc[date] += sale.total;
        } else {
          acc[date] = sale.total;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    // Convert to the required format
    return {
      labels: Object.keys(totalSales),
      datasets: [
        {
          label: "Daily Sales Total",
          data: Object.values(totalSales),
          fill: true,
          pointStyle: false,
        },
      ],
    };
  };

  return (
    <Show when={sales()}>
      {(salesList) => (
        <div class="container flex flex-col grow py-4">
          <div class="w-full flex flex-row h-full">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="font-semibold leading-none">Sales</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate(getSalesByWarehouseId.keyFor(params.whid)), {
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
                <div class="flex flex-col gap-2 w-full">
                  <div class="flex flex-col gap-2 w-full rounded-lg border h-60">
                    <div class="flex flex-col gap-2 w-full h-full p-4">
                      <LineChart data={calculateSales(salesList())} />
                    </div>
                  </div>
                </div>
                <div class="flex flex-row items-center justify-between gap-4">
                  <TextField
                    value={search()}
                    onChange={(e) => {
                      setSearch(e);
                      debouncedSearch(e);
                    }}
                    class="w-full max-w-full"
                  >
                    <TextFieldInput placeholder="Search sales" class="w-full max-w-full rounded-lg px-4" />
                  </TextField>
                  <div class="w-max">
                    <FilterPopover config={filterConfig} onChange={setFilterConfig} data={salesList} />
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
