import { Reorder } from "@/components/features/products/reorder";
import { LastOrderInfo } from "@/components/last-order-info";
import { InventoryList } from "@/components/lists/inventory";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getInventory, getInventoryAlerts } from "@/lib/api/inventory";
import { cn } from "@/lib/utils";
import Calendar from "@corvu/calendar";
import { createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import { createForm } from "@tanstack/solid-form";
import { type InventoryAlertInfo } from "@warehouseoetzidev/core/src/entities/inventory";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import ArrowRight from "lucide-solid/icons/arrow-right";
import CalendarPlus from "lucide-solid/icons/calendar-plus";
import Check from "lucide-solid/icons/check";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import { createSignal, For, Index, Show } from "solid-js";
import { toast } from "solid-sonner";

const { format: formatWeekdayLong } = new Intl.DateTimeFormat("en", { weekday: "long" });
const { format: formatWeekdayShort } = new Intl.DateTimeFormat("en", { weekday: "short" });
const { format: formatMonth } = new Intl.DateTimeFormat("en", { month: "long" });

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const inventories = getInventory();
    const alerts = getInventoryAlerts();
    return { user, sessionToken, inventories, alerts };
  },
} as RouteDefinition;

export default function InventoryPage() {
  const data = createAsync(() => getInventory(), { deferStream: true });
  const alertsData = createAsync(() => getInventoryAlerts(), { deferStream: true });

  return (
    <Show when={data()}>
      {(os) => (
        <div class="container flex flex-col grow py-4">
          <div class="w-full flex flex-row h-full gap-4">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="font-semibold leading-none">Inventory Summary</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate([getInventory.key, getInventoryAlerts.key]), {
                        loading: "Refreshing inventory...",
                        success: "Inventory refreshed",
                        error: "Failed to refresh inventory",
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
                <Show when={alertsData()}>
                  {(alerts) => (
                    <div class="flex flex-col gap-4">
                      <h2 class="font-semibold text-lg">Alerts</h2>
                      <div class="flex flex-col items-center w-full border rounded-lg overflow-hidden">
                        <For each={alerts()}>
                          {(a) => (
                            <div class="flex flex-row gap-4 items-center w-full border-b last:border-b-0 p-4">
                              <div class="flex-1 flex flex-col gap-4">
                                <div class="flex-1 flex flex-col gap-2">
                                  <div class="flex flex-row items-center gap-2">
                                    <div class="flex-1 font-semibold">{a.product.name}</div>
                                    <div class="text-sm text-muted-foreground">
                                      {a.count}/{a.product.minimumStock}
                                    </div>
                                  </div>
                                  <div class="flex flex-row items-center gap-2">
                                    <div class="flex-1 text-sm text-muted-foreground">{a.product.description}</div>
                                  </div>
                                </div>
                                <div class="flex flex-row items-center gap-2">
                                  <div class="flex-1 text-sm text-muted-foreground">
                                    <LastOrderInfo product={a.product} />
                                  </div>
                                  <div class="flex flex-row items-center gap-2">
                                    <Reorder
                                      product={() => ({
                                        ...a.product,
                                        preferredDate: a.product.lastPurchase.createdAt,
                                      })}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </Show>
                <InventoryList inventory={os} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
