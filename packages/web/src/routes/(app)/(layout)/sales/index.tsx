import { SalesList } from "@/components/lists/sales";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getSales } from "@/lib/api/sales";
import { A, createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { SaleInfo } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import BadgeEuro from "lucide-solid/icons/badge-euro";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const sales = await getSales();
    return { user, sessionToken, sales };
  },
} as RouteDefinition;

export default function SalesPage() {
  const params = useParams();
  const sales = createAsync(() => getSales(), { deferStream: true });

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
    <div class="flex flex-col-reverse md:flex-row w-full h-full gap-0 overflow-auto lg:overflow-hidden">
      <div class="w-full flex flex-row h-full gap-4 p-4 border-r-0 md:border-r md:overflow-auto">
        <div class="w-full flex flex-col">
          <div class="flex items-center gap-4 justify-between w-full pb-4">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <BadgeEuro class="size-4" />
              </div>
              <h1 class="font-semibold leading-none">Sales</h1>
            </div>
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
              <Button size="sm" class="pl-2.5 rounded-l-none" as={A} href="/sales/new">
                <Plus class="size-4" />
                <span class="sr-only md:not-sr-only">Create</span>
              </Button>
            </div>
          </div>
          <div class="flex flex-col gap-4 w-full grow">
            <Suspense
              fallback={
                <div class="flex flex-col gap-4 w-full">
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                </div>
              }
            >
              <Show when={sales()}>
                {(ss) => (
                  <Tabs defaultValue="clean" class="w-full max-w-full flex flex-col gap-2">
                    <TabsList class="flex flex-row w-full items-center justify-start h-max">
                      <TabsTrigger
                        value="clean"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-4"
                      >
                        Sales ({ss().filter((s) => !["deleted", "cancelled"].includes(s.status)).length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="confirmed"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-4"
                      >
                        Completed ({ss().filter((s) => s.status === "confirmed").length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="deleted"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-4"
                      >
                        Deleted ({ss().filter((s) => s.status === "deleted" || s.deletedAt).length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="cancelled"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-4"
                      >
                        Cancelled ({ss().filter((s) => s.status === "cancelled").length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="all"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-4"
                      >
                        All ({ss().length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="clean">
                      <SalesList data={() => ss().filter((s) => !["deleted", "cancelled"].includes(s.status))} />
                    </TabsContent>
                    <TabsContent value="confirmed">
                      <SalesList data={() => ss().filter((s) => s.status === "confirmed")} />
                    </TabsContent>
                    <TabsContent value="deleted">
                      <SalesList data={() => ss().filter((s) => s.status === "deleted" || s.deletedAt)} />
                    </TabsContent>
                    <TabsContent value="cancelled">
                      <SalesList data={() => ss().filter((s) => s.status === "cancelled")} />
                    </TabsContent>
                    <TabsContent value="all">
                      <SalesList data={() => ss()} />
                    </TabsContent>
                  </Tabs>
                )}
              </Show>
            </Suspense>
          </div>
        </div>
      </div>

      <div class="flex flex-col w-full md:w-[500px] p-4 md:overflow-auto border-b md:border-b-0 h-content"></div>
    </div>
  );
}
