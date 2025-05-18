import { SalesDataTable } from "@/components/sales/sales-data-table";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getSalesByWarehouseId } from "@/lib/api/sales";
import { createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { SaleInfo } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import PackageSearch from "lucide-solid/icons/package-search";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createSignal, For, Show, Suspense } from "solid-js";
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
  const [selectedSale, setSelectedSale] = createSignal<SaleInfo | null>(null);

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
    <Suspense fallback={<div class="p-4 w-full">Loading...</div>}>
      <Show when={sales()}>
        {(salesList) => (
          <div class="w-full flex flex-row grow">
            <div class="w-full p-4 flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="text-2xl font-bold leading-0">Sales</h1>
                <div class="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="secondary"
                    class="size-8"
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
                  <Button size="sm" class="h-8 pl-2">
                    <Plus class="size-4" />
                    Create
                  </Button>
                </div>
              </div>
              <div class="flex flex-col gap-2 w-full rounded-lg border h-60">
                <Show
                  when={salesList().length > 0}
                  fallback={
                    <div class="flex flex-col gap-2 w-full h-full items-center justify-center bg-muted-foreground/5 ">
                      <div class="flex flex-col gap-4 items-center justify-center text-muted-foreground">
                        <span class="text-sm">No sales data available</span>
                      </div>
                    </div>
                  }
                >
                  <div class="flex flex-col gap-2 w-full h-full">
                    <LineChart
                      // data={{
                      //   labels: salesList().map((s) => dayjs(s.createdAt).format("MMM DD")),
                      //   datasets: calculateSales(salesList()),
                      // }}
                      data={calculateSales(salesList())}
                    />
                  </div>
                </Show>
              </div>
              <Show when={salesList().length > 0}>
                <SalesDataTable data={salesList} onSelectedSale={setSelectedSale} />
              </Show>
            </div>
            <div class="w-full max-w-lg border-l flex flex-col grow">
              <For
                each={selectedSale()?.items}
                fallback={
                  <div class="p-4 w-full grow flex flex-col">
                    <div class="flex flex-col gap-4 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border text-muted-foreground">
                      <PackageSearch class="size-10 text-muted-foreground/50" stroke-width={1} />
                      <span class="text-sm">No sale selected</span>
                    </div>
                  </div>
                }
              >
                {(item) => (
                  <div class="p-4 w-full flex flex-col gap-4">
                    <div class="flex items-center gap-4 justify-between w-full">
                      <h1 class="text-2xl font-bold mb-4">{item.product.name}</h1>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
}
