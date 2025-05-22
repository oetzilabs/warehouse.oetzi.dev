import { SalesDataTable } from "@/components/sales/sales-data-table";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getSalesByWarehouseId } from "@/lib/api/sales";
import { cn } from "@/lib/utils";
import { createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { SaleInfo } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import PackageSearch from "lucide-solid/icons/package-search";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import X from "lucide-solid/icons/x";
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
  const [previewVisible, setPreviewVisible] = createSignal(false);

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
          <div class="w-full flex flex-row h-full border rounded-xl">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full p-4 border-b">
                <h1 class="font-semibold leading-none">Sales</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 h-8 rounded-r-none bg-background"
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
                  <Button size="sm" class="h-8 pl-2.5 rounded-l-none">
                    <Plus class="size-4" />
                    Create
                  </Button>
                </div>
              </div>
              <div class="flex flex-col gap-2 w-full grow px-4">
                <div class="flex flex-col gap-2 w-full rounded-lg border h-60">
                  <Show
                    when={salesList().length > 0}
                    fallback={
                      <div class="flex flex-col gap-2 w-full h-full items-center justify-center bg-muted-foreground/5 ">
                        <div class="flex flex-col gap-4 items-center justify-center text-muted-foreground select-none">
                          <span class="text-sm">No sales data available</span>
                        </div>
                      </div>
                    }
                  >
                    <div class="flex flex-col gap-2 w-full h-full">
                      <LineChart data={calculateSales(salesList())} />
                    </div>
                  </Show>
                </div>
                <Show when={salesList().length > 0}>
                  <SalesDataTable
                    data={salesList}
                    onSelectedSale={(sale) => {
                      setSelectedSale(sale);
                      setPreviewVisible(true);
                    }}
                  />
                </Show>
              </div>
            </div>
            <div
              class={cn("w-full lg:max-w-lg border-l lg:flex hidden flex-col grow", {
                "!hidden": !previewVisible(),
              })}
            >
              <div class="w-full flex flex-row gap-4 items-center justify-between border-b p-4">
                <h2 class="font-semibold leading-none">Preview Sale</h2>
                <Button
                  size="icon"
                  variant="secondary"
                  class="size-8"
                  onClick={() => {
                    setPreviewVisible(false);
                  }}
                >
                  <X class="size-4" />
                </Button>
              </div>
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
        </div>
      )}
    </Show>
  );
}
