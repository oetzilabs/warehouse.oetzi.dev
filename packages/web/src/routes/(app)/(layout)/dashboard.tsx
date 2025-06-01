import ArrowBadge from "@/components/badges/arrow";
import { OrderStatusBadge } from "@/components/badges/order-status";
import { Alert, AlertClose, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getDashboardData } from "@/lib/api/dashboard";
import { getInventory } from "@/lib/api/inventory";
import { acceptNotification, getNotifications } from "@/lib/api/notifications";
import { getPendingSupplyOrders } from "@/lib/api/orders";
import { getSchedules } from "@/lib/api/schedules";
import "@fontsource-variable/geist-mono";
import { A, createAsync, revalidate, RouteDefinition, useAction, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import CalendarClock from "lucide-solid/icons/calendar-clock";
import Check from "lucide-solid/icons/check";
import ClockFading from "lucide-solid/icons/clock-fading";
import Info from "lucide-solid/icons/info";
import Package from "lucide-solid/icons/package";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Workflow from "lucide-solid/icons/workflow";
import { For, Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async () => {
    getAuthenticatedUser();
    getDashboardData();
  },
} satisfies RouteDefinition;

export default function DashboardPage() {
  const data = createAsync(async () => getDashboardData(), { deferStream: true });
  const notifications = createAsync(async () => getNotifications(), { deferStream: true });
  const inventory = createAsync(async () => getInventory(), { deferStream: true });
  const schedules = createAsync(async () => getSchedules(), { deferStream: true });
  const pendingSupplyOrders = createAsync(async () => getPendingSupplyOrders(), { deferStream: true });

  const acceptNotificationAction = useAction(acceptNotification);
  const isAcceptingNotification = useSubmission(acceptNotification);

  return (
    <div class="flex flex-col w-full grow">
      <div class="flex flex-col gap-4 w-full grow p-4 container">
        <div class="flex flex-row gap-4 items-center justify-between">
          <div class="flex flex-row items-baseline gap-4 py-2">
            <span class="font-semibold leading-none">Overview</span>
          </div>
          <div class="w-max">
            <Button
              size="sm"
              onClick={() => {
                toast.promise(
                  revalidate([
                    getNotifications.key,
                    getDashboardData.key,
                    getInventory.key,
                    getPendingSupplyOrders.key,
                  ]),
                  {
                    loading: "Refreshing dashboard...",
                    success: "Refreshed dashboard",
                    error: "Failed to refresh dashboard",
                  },
                );
              }}
            >
              <RotateCw class="size-4" />
              Refresh
            </Button>
          </div>
        </div>
        <div class="flex flex-col w-full h-content">
          <div class="w-full h-content">
            <div class="flex flex-col w-full h-content gap-4">
              <Show when={notifications()}>
                {(notifs) => (
                  <div class="flex flex-col w-full h-content gap-4">
                    <For
                      each={notifs()}
                      fallback={
                        <Alert>
                          <Check class="size-4" />
                          <AlertTitle>No notifications!</AlertTitle>
                          <AlertDescription>
                            <span>You're all caught up! No new notifications.</span>
                          </AlertDescription>
                        </Alert>
                      }
                    >
                      {(notification) => (
                        <Alert>
                          <Info class="size-4" />
                          <AlertTitle>{notification.title}</AlertTitle>
                          <AlertDescription>{notification.content}</AlertDescription>
                          <AlertClose
                            disabled={isAcceptingNotification.pending}
                            onClick={() => {
                              toast.promise(acceptNotificationAction(notification.id), {
                                loading: "Closing notification...",
                                success: "Closed notification",
                                error: "Failed to close notification",
                              });
                            }}
                          />
                        </Alert>
                      )}
                    </For>
                  </div>
                )}
              </Show>
              <div class="grid grid-cols-2 md:grid-cols-4 w-full h-full border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 items-center">
                <Show when={inventory()}>
                  {(inv) => (
                    <A
                      class="flex flex-col gap-4 p-4 w-full border-b md:border-b-0 border-r hover:bg-muted-foreground/5 h-full min-h-36 md:min-h-28"
                      href="/inventory"
                    >
                      <div class="flex items-center gap-4 justify-between w-full">
                        <span class="font-semibold">Stock</span>
                        <Package class="size-4" />
                      </div>
                      <div class="flex grow"></div>
                      <div class="flex flex-row gap-2 items-center justify-between">
                        <span class="text-2xl text-neutral-500 dark:text-neutral-400 font-['Geist_Mono_Variable']">
                          {inv().totalCurrentOccupancy}/{inv().totalCapacity}
                        </span>
                        <div
                          class="flex flex-row items-center gap-2 bg-muted-foreground/10 dark:bg-neutral-900 rounded-full px-2 py-0.5 border"
                          title={`${inv().amounOfStorages} Storages`}
                        >
                          <span class="text-xs text-muted-foreground font-['Geist_Mono_Variable']">
                            {inv().amounOfStorages}
                          </span>
                          <div class="size-2 bg-muted-foreground rounded-full" />
                        </div>
                      </div>
                    </A>
                  )}
                </Show>
                <Show when={schedules()}>
                  {(s) => (
                    <A
                      class="flex flex-col gap-4 p-4 w-full border-b md:border-b-0 md:border-r hover:bg-muted-foreground/5 h-full min-h-36 md:min-h-28"
                      href="/schedule"
                    >
                      <div class="flex items-center gap-4 justify-between w-full">
                        <span class="font-semibold">Schedules</span>
                        <CalendarClock class="size-4" />
                      </div>
                      <div class="flex grow"></div>
                      <span class="text-2xl text-neutral-500 dark:text-neutral-400 font-['Geist_Mono_Variable']">
                        {s().length}
                      </span>
                    </A>
                  )}
                </Show>
                <Show when={pendingSupplyOrders()}>
                  {(pso) => (
                    <A
                      class="flex flex-col gap-4 p-4 w-full border-r hover:bg-muted-foreground/5 h-full min-h-36 md:min-h-28"
                      href="/purchases"
                    >
                      <div class="flex items-center gap-4 justify-between w-full">
                        <span class="font-semibold">Pending Purchases</span>
                        <ClockFading class="size-4" />
                      </div>
                      <div class="flex grow"></div>
                      <span class="text-2xl text-neutral-500 dark:text-neutral-400 font-['Geist_Mono_Variable']">
                        {pso().length}
                      </span>
                    </A>
                  )}
                </Show>
                <A
                  class="flex flex-col gap-4 p-4 w-full hover:bg-muted-foreground/5 h-full min-h-36 md:min-h-28"
                  href="#"
                >
                  <div class="flex items-center gap-4 justify-between w-full">
                    <span class="font-semibold">Async Work</span>
                    <Workflow class="size-4" />
                  </div>
                  <div class="flex grow"></div>
                  <span class="text-2xl text-neutral-500 dark:text-neutral-400 font-['Geist_Mono_Variable']">0</span>
                </A>
              </div>
              <Show when={data()}>
                {(d) => (
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full grow ">
                    <div class="flex flex-col w-full h-full border border-neutral-200 dark:border-neutral-800 rounded-lg grow">
                      <div class="flex flex-row items-center justify-between p-4">
                        <div class="flex flex-row gap-4">
                          <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">Customer Orders</h3>
                          <span class="text-sm text-neutral-500 dark:text-neutral-400">
                            <ArrowBadge value={d().orders.customers.deltaPercentageLastWeek} class="hidden md:block" />
                          </span>
                        </div>
                        <div class="flex flex-row gap-2">
                          <Button size="sm" as={A} href="/orders/new" disabled variant="secondary">
                            <Plus class="size-4" />
                            Create
                          </Button>
                          <Button size="sm" as={A} href="/orders">
                            View All
                            <ArrowUpRight class="size-4" />
                          </Button>
                        </div>
                      </div>
                      <div class="flex flex-col border-t border-neutral-200 dark:border-neutral-800 grow">
                        <Show
                          when={d().orders.customers.chartData.some((v) => v > 0)}
                          fallback={
                            <div class="flex flex-row gap-4 items-center justify-center p-4 h-[200px] bg-muted-foreground/5 grow">
                              <span class="text-sm select-none text-muted-foreground">No customer orders added</span>
                            </div>
                          }
                        >
                          <>
                            <div class="h-[200px]">
                              <LineChart
                                height={200}
                                data={{
                                  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                                  datasets: [
                                    {
                                      label: "Orders",
                                      data: d().orders.customers.chartData || [],
                                      fill: true,
                                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                                      borderColor: "rgb(59, 130, 246)",
                                      tension: 0.4,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  scales: {
                                    x: {
                                      grid: {
                                        display: false,
                                      },
                                      border: {
                                        display: false,
                                      },
                                      ticks: {
                                        color: "rgb(163, 163, 163)", // neutral-400
                                      },
                                    },
                                    y: {
                                      border: {
                                        dash: [4, 4],
                                      },
                                      grid: {
                                        color: "rgba(163, 163, 163, 0.2)", // neutral-400 with opacity
                                      },
                                      ticks: {
                                        color: "rgb(163, 163, 163)", // neutral-400
                                      },
                                    },
                                  },
                                  plugins: {
                                    legend: {
                                      display: false,
                                    },
                                  },
                                }}
                              />
                            </div>
                            <div class="flex flex-col border-t border-neutral-200 dark:border-neutral-800 grow">
                              <For each={d().orders.customers.values}>
                                {(item) => (
                                  <div class="flex flex-row items-center gap-3 p-3 border-b last:border-b-0 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                    <OrderStatusBadge status={item.order.status} />
                                    <div class="flex flex-col grow">
                                      <span class="font-medium text-neutral-900 dark:text-neutral-100">
                                        {item.order.title}
                                      </span>
                                      <span class="text-sm text-neutral-500 dark:text-neutral-400">
                                        {dayjs(item.order.createdAt).format("MMM D, YYYY")}
                                      </span>
                                    </div>
                                    <Button
                                      size="sm"
                                      as={A}
                                      variant="outline"
                                      class="bg-background"
                                      href={`/customers/${item.customerId}/orders/${item.order.id}`}
                                    >
                                      Open
                                      <ArrowUpRight class="size-4" />
                                    </Button>
                                  </div>
                                )}
                              </For>
                            </div>
                          </>
                        </Show>
                      </div>
                    </div>
                    <div class="flex flex-col w-full h-full border border-neutral-200 dark:border-neutral-800 rounded-lg grow">
                      <div class="flex flex-row items-center justify-between p-4">
                        <div class="flex flex-row gap-2">
                          <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">Purchases</h3>
                          <span class="text-sm text-neutral-500 dark:text-neutral-400">
                            <ArrowBadge value={d().orders.suppliers.deltaPercentageLastWeek} class="hidden md:block" />
                          </span>
                        </div>
                        <div class="flex flex-row gap-2">
                          <Button size="sm" as={A} href="/purchases/new" disabled variant="secondary">
                            <Plus class="size-4" />
                            Create
                          </Button>
                          <Button size="sm" as={A} href="/purchases">
                            View All
                            <ArrowUpRight class="size-4" />
                          </Button>
                        </div>
                      </div>
                      <div class="flex flex-col border-t border-neutral-200 dark:border-neutral-800">
                        <Show
                          when={d().orders.suppliers.chartData.some((v) => v > 0)}
                          fallback={
                            <div class="flex flex-row gap-4 items-center justify-center p-4 h-[200px] bg-muted-foreground/5">
                              <span class="text-sm select-none text-muted-foreground">No supplier orders added</span>
                            </div>
                          }
                        >
                          <>
                            <div class="h-[200px]">
                              <LineChart
                                height={200}
                                data={{
                                  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                                  datasets: [
                                    {
                                      label: "Supplier Orders",
                                      data: d().orders.suppliers.chartData || [],
                                      fill: true,
                                      backgroundColor: "rgba(236, 72, 153, 0.1)",
                                      borderColor: "rgb(236, 72, 153)",
                                      tension: 0.4,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  scales: {
                                    x: {
                                      grid: { display: false },
                                      border: { display: false },
                                      ticks: { color: "rgb(163, 163, 163)" },
                                    },
                                    y: {
                                      border: { dash: [4, 4] },
                                      grid: { color: "rgba(163, 163, 163, 0.2)" },
                                      ticks: { color: "rgb(163, 163, 163)" },
                                    },
                                  },
                                  plugins: { legend: { display: false } },
                                }}
                              />
                            </div>
                            <div class="flex flex-col border-t border-neutral-200 dark:border-neutral-800 grow">
                              <For each={d().orders.suppliers.values}>
                                {(item) => (
                                  <div class="flex flex-row items-center gap-3 p-3 border-b last:border-b-0 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                    <OrderStatusBadge status={item.order.status} />
                                    <div class="flex flex-col grow">
                                      <span class="font-medium text-neutral-900 dark:text-neutral-100">
                                        {item.order.title}
                                      </span>
                                      <span class="text-sm text-neutral-500 dark:text-neutral-400">
                                        {dayjs(item.order.createdAt).format("MMM D, YYYY")}
                                      </span>
                                    </div>
                                    <Button
                                      size="sm"
                                      as={A}
                                      variant="outline"
                                      class="bg-background"
                                      href={`/suppliers/${item.supplierId}/orders/${item.order.id}`}
                                    >
                                      Open
                                      <ArrowUpRight class="size-4" />
                                    </Button>
                                  </div>
                                )}
                              </For>
                            </div>
                          </>
                        </Show>
                      </div>
                    </div>
                    <div class="flex flex-col  w-full h-full border border-neutral-200 dark:border-neutral-800 rounded-lg grow">
                      <div class="flex flex-row items-center justify-between p-4">
                        <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">Most Popular Products</h3>
                        <div class="flex flex-row gap-2">
                          <Button size="sm" as={A} href="/products">
                            View All
                            <ArrowUpRight class="size-4" />
                          </Button>
                        </div>
                      </div>
                      <div class="flex flex-col grow">
                        <div class="flex flex-col border-t border-neutral-200 dark:border-neutral-800 grow">
                          <For each={d().mostPopularProductsFromOrders}>
                            {(product) => (
                              <div class="flex flex-row items-center gap-3 p-3 border-b last:border-b-0 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                <div class="flex flex-col grow">
                                  <span class="font-medium text-neutral-900 dark:text-neutral-100">
                                    {product.product.name}
                                  </span>
                                  <span class="text-sm text-neutral-500 dark:text-neutral-400">
                                    {product.orderCount} orders
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  as={A}
                                  href={`/orders/suppliers/${product.product.id}`}
                                  variant="outline"
                                  class="bg-background"
                                >
                                  Open
                                  <ArrowUpRight class="size-4" />
                                </Button>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-col  w-full h-full border border-neutral-200 dark:border-neutral-800 rounded-lg grow">
                      <div class="flex flex-row items-center justify-between p-4">
                        <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">Last Sold Products</h3>
                        <div class="flex flex-row gap-2">
                          <Button size="sm" as={A} href="/products/new">
                            <Plus class="size-4" />
                            Create
                          </Button>
                        </div>
                      </div>
                      <div class="flex flex-col border-t border-neutral-200 dark:border-neutral-800 grow">
                        <div class="flex flex-col grow">
                          <For each={d().lastUsedProductsFromCustomers}>
                            {(product) => (
                              <div class="flex flex-row items-center gap-3 p-3 border-b last:border-b-0 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                <div class="flex flex-col grow">
                                  <span class="font-medium text-neutral-900 dark:text-neutral-100">
                                    {product.product.name}
                                  </span>
                                  <span class="text-sm text-neutral-500 dark:text-neutral-400">
                                    {dayjs(product.createdAt).format("MMM D, YYYY")}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  as={A}
                                  href={`/orders/suppliers/${product.product.id}`}
                                  variant="outline"
                                  class="bg-background"
                                >
                                  Open
                                  <ArrowUpRight class="size-4" />
                                </Button>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
