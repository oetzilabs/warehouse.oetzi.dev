import { OrderStatusBadge } from "@/components/badges/order-status";
import { LastSoldProducts } from "@/components/features/dashboard/last-sold-prodcuts";
import { MostSoldProducts } from "@/components/features/dashboard/most-sold-products";
import { useDashboardFeatures } from "@/components/providers/Dashboard";
import { Alert, AlertClose, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getDashboardData, getLastSoldProducts, getMostPopularProducts } from "@/lib/api/dashboard";
import { getInventory } from "@/lib/api/inventory";
import { acceptNotification, getNotifications } from "@/lib/api/notifications";
import { getPendingPurchases } from "@/lib/api/purchases";
import { getSchedules } from "@/lib/api/schedules";
import { A, createAsync, RouteDefinition, useAction, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import CalendarClock from "lucide-solid/icons/calendar-clock";
import Check from "lucide-solid/icons/check";
import ClockFading from "lucide-solid/icons/clock-fading";
import Info from "lucide-solid/icons/info";
import Loader2 from "lucide-solid/icons/loader-2";
import Package from "lucide-solid/icons/package";
import Plus from "lucide-solid/icons/plus";
import Workflow from "lucide-solid/icons/workflow";
import { createMemo, For, Show } from "solid-js";
import { toast } from "solid-sonner";

dayjs.extend(localizedFormat);

export const route = {
  preload: async () => {
    getAuthenticatedUser();
    getDashboardData();
  },
} satisfies RouteDefinition;

export default function DashboardPage() {
  const start = new Date();
  const end = dayjs(start).endOf("month").toDate();
  const data = createAsync(async () => getDashboardData(), { deferStream: true });
  const notifications = createAsync(async () => getNotifications(), { deferStream: true });
  const inventory = createAsync(async () => getInventory(), { deferStream: true });
  const schedules = createAsync(async () => getSchedules([start, end]), { deferStream: true });
  const pendingSupplyOrders = createAsync(async () => getPendingPurchases(), { deferStream: true });

  const acceptNotificationAction = useAction(acceptNotification);
  const isAcceptingNotification = useSubmission(acceptNotification);
  const { dashboardFeatures } = useDashboardFeatures();

  return (
    <div class="flex flex-col-reverse md:flex-row w-full grow p-2 gap-2">
      <div class="flex flex-col gap-2 w-full grow overflow-auto pr-0 md:pr-2 border-r-0 md:border-r">
        <div class="flex flex-col w-full h-content">
          <div class="w-full h-content">
            <div class="flex flex-col w-full h-content gap-2">
              <div class="grid grid-cols-2 md:grid-cols-4 w-full h-full border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 items-center">
                <Show when={inventory()}>
                  {(inv) => (
                    <A
                      class="flex flex-col gap-4 p-4 w-full border-b md:border-b-0 border-r hover:bg-muted-foreground/5 h-full min-h-36 md:min-h-28"
                      href="/stock"
                    >
                      <div class="flex items-center gap-4 justify-between w-full">
                        <span class="font-semibold">Stock</span>
                        <Package class="size-4" />
                      </div>
                      <div class="flex grow"></div>
                      <div class="flex flex-row gap-2 items-center justify-between">
                        <span class="text-2xl text-neutral-500 dark:text-neutral-400 font-['Geist_Mono_Variable']">
                          {inv()
                            .products.map((p) => p.count)
                            .reduce((acc, curr) => acc + curr, 0)}
                          /{inv().capacity}
                        </span>
                      </div>
                    </A>
                  )}
                </Show>
                <Show when={schedules()}>
                  {(s) => (
                    <A
                      class="flex flex-col gap-4 p-4 w-full border-b md:border-b-0 md:border-r hover:bg-muted-foreground/5 h-full min-h-36 md:min-h-28"
                      href="/schedules"
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
              <div class="flex flex-col gap-2 w-full grow">
                <Show when={data()}>
                  {(d) => (
                    <>
                      <div class="flex flex-col w-full h-full border border-neutral-200 dark:border-neutral-800 rounded-lg grow">
                        <div class="flex flex-row items-center justify-between p-2 pl-4 bg-muted-foreground/5 dark:bg-muted/30">
                          <div class="flex flex-row gap-4">
                            <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">Customer Orders</h3>
                          </div>
                          <div class="flex flex-row gap-2">
                            <Button
                              size="sm"
                              as={A}
                              href="/orders/new"
                              disabled
                              variant="outline"
                              class="bg-background"
                            >
                              <span class="sr-only md:not-sr-only">Create</span>
                              <Plus class="size-4" />
                            </Button>
                            <Button size="sm" as={A} href="/orders">
                              View All
                              <ArrowUpRight class="size-4" />
                            </Button>
                          </div>
                        </div>
                        <div class="flex flex-col border-t border-neutral-200 dark:border-neutral-800 grow">
                          <div class="flex flex-col grow h-full">
                            <For
                              each={d().orders.customers.values}
                              fallback={
                                <div class="flex flex-col items-center justify-center h-full">
                                  <div class="w-full h-full flex items-center justify-center py-10">
                                    <div class="w-full h-full flex items-center justify-center text-sm text-muted-foreground select-none">
                                      You haven't received any orders yet. Create one now to get started.
                                    </div>
                                  </div>
                                </div>
                              }
                            >
                              {(item) => (
                                <div class="flex flex-row items-center gap-3 p-4 border-b last:border-b-0 border-neutral-200 dark:border-neutral-800 hover:bg-muted-foreground/[0.025] dark:hover:bg-muted/15 transition-colors h-full">
                                  <OrderStatusBadge status={item.order.status} />
                                  <div class="flex flex-col grow">
                                    <span class="font-medium text-neutral-900 dark:text-neutral-100">
                                      {item.order.title}
                                    </span>
                                    <span class="text-sm text-neutral-500 dark:text-neutral-400">
                                      {dayjs(item.order.createdAt).format("MMM D, YYYY")}, {item.order.products.length}{" "}
                                      {item.order.products.length > 1 ? "Products" : "Product"}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    as={A}
                                    variant="outline"
                                    class="bg-background"
                                    href={`/orders/${item.order.id}`}
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
                      <div class="flex flex-col w-full h-full border border-neutral-200 dark:border-neutral-800 rounded-lg grow">
                        <div class="flex flex-row items-center justify-between p-2 pl-4 bg-muted-foreground/5 dark:bg-muted/30">
                          <div class="flex flex-row gap-2">
                            <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">Purchases</h3>
                          </div>
                          <div class="flex flex-row gap-2">
                            <Button
                              size="sm"
                              as={A}
                              href="/purchases/new"
                              disabled
                              variant="outline"
                              class="bg-background"
                            >
                              <span class="sr-only md:not-sr-only">Create</span>
                              <Plus class="size-4" />
                            </Button>
                            <Button size="sm" as={A} href="/purchases">
                              View All
                              <ArrowUpRight class="size-4" />
                            </Button>
                          </div>
                        </div>
                        <div class="flex flex-col border-t border-neutral-200 dark:border-neutral-800">
                          <div class="flex flex-col  grow">
                            <For
                              each={d().orders.suppliers.values}
                              fallback={
                                <div class="flex flex-col items-center justify-center h-full">
                                  <div class="w-full h-full flex items-center justify-center py-10">
                                    <div class="w-full h-full flex items-center justify-center text-sm text-muted-foreground select-none">
                                      You haven't sent any purchases yet. Set up your first supplier to get started.
                                    </div>
                                  </div>
                                </div>
                              }
                            >
                              {(item) => (
                                <div class="flex flex-row items-center gap-3 p-4 border-b last:border-b-0 border-neutral-200 dark:border-neutral-800 hover:bg-muted-foreground/[0.025] dark:hover:bg-muted/15 transition-colors">
                                  <OrderStatusBadge status={item.order.status} />
                                  <div class="flex flex-col grow">
                                    <span class="font-medium text-neutral-900 dark:text-neutral-100">
                                      {item.order.title}
                                    </span>
                                    <span class="text-sm text-neutral-500 dark:text-neutral-400">
                                      {dayjs(item.order.createdAt).format("MMM D, YYYY")}, {item.order.products.length}{" "}
                                      {item.order.products.length > 1 ? "Products" : "Product"}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    as={A}
                                    variant="outline"
                                    class="bg-background"
                                    href={`/purchases/${item.order.id}`}
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
                      <Show when={dashboardFeatures.mostPopularProducts.enabled}>
                        <MostSoldProducts />
                      </Show>
                      <Show when={dashboardFeatures.lastSoldProducts.enabled}>
                        <LastSoldProducts />
                      </Show>
                      <div class="flex items-center justify-center gap-2 text-sm py-4 pb-8 text-neutral-500 dark:text-neutral-400">
                        <A href="/settings" class="flex items-center gap-1 hover:underline">
                          Customize Dashboard
                          <ArrowUpRight class="size-4" />
                        </A>
                      </div>
                    </>
                  )}
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full md:w-[500px] grow relative">
        <Show when={notifications()}>
          {(notifs) => (
            <div class="flex flex-col w-full h-content gap-4">
              <For
                each={notifs()}
                fallback={
                  <div class="bg-muted-foreground/10 dark:bg-muted/30 flex flex-col p-4 border rounded-lg gap-2">
                    <div class="flex flex-row items-start gap-2 w-full justify-between">
                      <div class="flex flex-row items-center gap-2">
                        <Check class="size-4" />
                        <span class="text-sm font-medium">No notifications!</span>
                      </div>
                      <Button size="sm" as={A} href="/notifications">
                        View all messages
                        <ArrowUpRight class="size-4" />
                      </Button>
                    </div>
                    <span class="text-xs text-muted-foreground">You're all caught up! No new notifications.</span>
                  </div>
                }
              >
                {(notification) => (
                  <div class="bg-muted-foreground/10 dark:bg-muted/30 flex flex-col p-4 border rounded-lg gap-2">
                    <div class="flex flex-row items-start gap-2 w-full justify-between">
                      <div class="flex flex-row items-center gap-2">
                        <Info class="size-4" />
                        <span class="text-sm font-medium">{notification.title}</span>
                      </div>
                    </div>
                    <div class="prose prose-sm prose-neutral dark:prose-invert">
                      <span>{notification.content}</span>
                    </div>
                    <div class="flex flex-row items-center justify-between gap-2">
                      <div class="">
                        <span class="text-xs">{dayjs(notification.createdAt).format("LLL")}</span>
                      </div>
                      <Button
                        size="sm"
                        class="w-max"
                        disabled={isAcceptingNotification.pending}
                        onClick={() => {
                          toast.promise(acceptNotificationAction(notification.id), {
                            loading: "Closing notification...",
                            success: "Closed notification",
                            error: "Failed to close notification",
                          });
                        }}
                      >
                        Mark as read
                      </Button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}
