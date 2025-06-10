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
                                    <ReorderDialog product={a.product} />
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

const ReorderDialog = (props: { product: InventoryAlertInfo[number]["product"] }) => {
  const [reorderDialog, setReorderDialog] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      supplierId: props.product.suppliers.length > 0 ? props.product.suppliers[0].supplier.id : "",
      amount: props.product.reorderPoint ?? props.product.minimumStock,
      preferredDate: new Date(),
    } satisfies {
      supplierId: string;
      amount: number;
      preferredDate: Date;
    },
  }));

  return (
    <Dialog
      open={reorderDialog()}
      onOpenChange={(x) => {
        setReorderDialog(x);
        form.reset();
      }}
    >
      <DialogTrigger as={Button} size="sm">
        Reorder Now
        <CalendarPlus class="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Prepare to Reorder</DialogTitle>
          <DialogDescription>
            Here you can prepare to reorder <span class="font-semibold">{props.product.name}</span>. Please choose a
            supplier, the amount and a preferred date.
          </DialogDescription>
          <div class="flex flex-col items-center w-full border rounded-lg overflow-hidden">
            <form.Field name="supplierId">
              {(field) => (
                <div class="flex flex-col gap-4 items-center w-full border-b last:border-b-0">
                  <For
                    each={props.product.suppliers}
                    fallback={
                      <div class="flex p-10 flex-col items-center text-muted-foreground justify-center text-sm bg-muted-foreground/5 dark:bg-muted/30 w-full">
                        No suppliers found
                      </div>
                    }
                  >
                    {(supplier) => (
                      <div class="flex flex-row gap-4 items-center w-full border-b last:border-b-0 p-4">
                        <div class="flex-1 flex flex-col gap-1">
                          <div class="flex flex-row items-center gap-2">
                            <div class="flex-1 font-semibold">{supplier.supplier.name}</div>
                          </div>
                          <div class="flex flex-row items-center gap-2">
                            <div class="flex-1 text-sm text-muted-foreground">
                              {supplier.supplier.email} • {supplier.supplier.website ?? "N/A"} •{" "}
                              {supplier.supplier.phone ?? "N/A"}
                            </div>
                          </div>
                          <div class="flex flex-row items-center gap-2 py-2">
                            <For
                              each={supplier.supplier.contacts}
                              fallback={
                                <div class="flex p-4 flex-col items-center text-muted-foreground justify-center text-sm bg-muted-foreground/5 dark:bg-muted/30 w-full rounded-md border">
                                  No contacts set up.
                                </div>
                              }
                            >
                              {(contact) => (
                                <div class="flex flex-row items-center gap-2">
                                  <div class="flex-1 text-sm text-muted-foreground">
                                    {contact.email} • {contact.phone ?? "N/A"}
                                  </div>
                                </div>
                              )}
                            </For>
                          </div>
                          <div class="flex flex-row items-center gap-2">
                            <div class="w-full"></div>
                            <div class="w-max">
                              <Button
                                size="sm"
                                onClick={() => {
                                  field().setValue(supplier.supplier.id);
                                }}
                              >
                                Choose
                                <Show when={field().state.value === supplier.supplier.id}>
                                  <Check class="size-4" />
                                </Show>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              )}
            </form.Field>
            <div class="flex flex-col items-center w-full border-b last:border-b-0 p-4">
              <form.Subscribe selector={(state) => ({ date: state.values.preferredDate })}>
                {(state) => (
                  <div class="flex flex-row gap-2 w-full">
                    <Calendar
                      mode="single"
                      numberOfMonths={1}
                      initialValue={state().date ?? new Date()}
                      onValueChange={(date) => {
                        if (!date) return;
                        form.setFieldValue("preferredDate", date);
                      }}
                    >
                      {(props) => (
                        <div class="relative w-full">
                          <Calendar.Nav
                            action="prev-month"
                            aria-label="Go to previous month"
                            as={Button}
                            size="icon"
                            class="absolute left-0"
                            variant="secondary"
                            type="button"
                          >
                            <ArrowLeft class="size-4" />
                          </Calendar.Nav>
                          <Calendar.Nav
                            action="next-month"
                            aria-label="Go to next month"
                            as={Button}
                            size="icon"
                            class="absolute right-0"
                            variant="secondary"
                            type="button"
                          >
                            <ArrowRight class="size-4" />
                          </Calendar.Nav>
                          <div class="w-full h-content flex flex-row gap-4">
                            <Index each={props.months}>
                              {(month, index) => (
                                <div class="w-full flex flex-col gap-4">
                                  <div class="flex h-8 items-center justify-center">
                                    <Calendar.Label index={index} class="text-sm">
                                      {formatMonth(month().month)} {month().month.getFullYear()}
                                    </Calendar.Label>
                                  </div>
                                  <Calendar.Table index={index} class="w-full">
                                    <thead>
                                      <tr>
                                        <Index each={props.weekdays}>
                                          {(weekday) => (
                                            <Calendar.HeadCell
                                              abbr={formatWeekdayLong(weekday())}
                                              class="w-8 flex-1 pb-1 text-sm font-normal text-muted-foreground"
                                            >
                                              {formatWeekdayShort(weekday())}
                                            </Calendar.HeadCell>
                                          )}
                                        </Index>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <Index each={month().weeks}>
                                        {(week) => (
                                          <tr>
                                            <Index each={week()}>
                                              {(day) => (
                                                <Calendar.Cell class="p-1 has-data-range-end:rounded-r-md has-data-range-start:rounded-l-md has-data-in-range:bg-muted/70">
                                                  <Calendar.CellTrigger
                                                    type="button"
                                                    day={day()}
                                                    month={month().month}
                                                    as={Button}
                                                    size="sm"
                                                    variant="outline"
                                                    class={cn("inline-flex w-full bg-background", {
                                                      "bg-primary text-white":
                                                        day().toDateString() === new Date().toDateString(),
                                                      "!bg-primary/50 !text-primary":
                                                        day().toDateString() === state().date?.toDateString(),
                                                    })}
                                                  >
                                                    {day().getDate()}
                                                  </Calendar.CellTrigger>
                                                </Calendar.Cell>
                                              )}
                                            </Index>
                                          </tr>
                                        )}
                                      </Index>
                                    </tbody>
                                  </Calendar.Table>
                                </div>
                              )}
                            </Index>
                          </div>
                        </div>
                      )}
                    </Calendar>
                  </div>
                )}
              </form.Subscribe>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReorderDialog(false);
              form.reset();
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              form.handleSubmit();
            }}
          >
            Reorder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
