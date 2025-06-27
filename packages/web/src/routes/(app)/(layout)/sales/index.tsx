import { SalesList } from "@/components/lists/sales";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getSales } from "@/lib/api/sales";
import { A, createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { SaleInfo } from "@warehouseoetzidev/core/src/entities/sales";
import dayjs from "dayjs";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { Show, Suspense } from "solid-js";
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
    <div class="container flex flex-col grow py-8">
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
              <Button size="sm" class="pl-2.5 rounded-l-none" as={A} href="/sales/new">
                <Plus class="size-4" />
                Create
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
                  <Tabs defaultValue="all" class="w-full max-w-full">
                    <TabsList class="flex flex-row w-full items-center justify-start h-max">
                      <TabsTrigger
                        value="all"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-2"
                      >
                        All Non-Deleted Sales ({ss().filter((s) => s.status !== "deleted" || !s.deletedAt).length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="confirmed"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-2"
                      >
                        Completed ({ss().filter((s) => s.status === "confirmed").length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="deleted"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-2"
                      >
                        Deleted ({ss().filter((s) => s.status === "deleted" || s.deletedAt).length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" class="pt-2">
                      <SalesList data={() => ss().filter((s) => s.status !== "deleted" || !s.deletedAt)} />
                    </TabsContent>
                    <TabsContent value="confirmed" class="pt-2">
                      <SalesList data={() => ss().filter((s) => s.status === "confirmed")} />
                    </TabsContent>
                    <TabsContent value="deleted" class="pt-2">
                      <SalesList data={() => ss().filter((s) => s.status === "deleted" || s.deletedAt)} />
                    </TabsContent>
                  </Tabs>
                )}
              </Show>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
