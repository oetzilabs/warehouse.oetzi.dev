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
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from "@/components/ui/number-field";
import { cn } from "@/lib/utils";
import Calendar from "@corvu/calendar";
import { createForm } from "@tanstack/solid-form";
import { type InventoryAlertInfo } from "@warehouseoetzidev/core/src/entities/inventory";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import ArrowRight from "lucide-solid/icons/arrow-right";
import CalendarPlus from "lucide-solid/icons/calendar-plus";
import Check from "lucide-solid/icons/check";
import { Accessor, createMemo, createSignal, For, Index, Show } from "solid-js";

const { format: formatWeekdayLong } = new Intl.DateTimeFormat("en", { weekday: "long" });
const { format: formatWeekdayShort } = new Intl.DateTimeFormat("en", { weekday: "short" });
const { format: formatMonth } = new Intl.DateTimeFormat("en", { month: "long" });

type ReorderProps = {
  product: Accessor<Omit<InventoryAlertInfo[number]["product"], "lastPurchase"> & { preferredDate?: Date }>;
};

export const Reorder = (props: ReorderProps) => {
  const [reorderDialog, setReorderDialog] = createSignal(false);

  const lastPreferredPurchaseDayOfWeek = createMemo(() => {
    const preferredPurchase = props.product().preferredDate
      ? dayjs(props.product().preferredDate).day()
      : dayjs().add(1, "day").day();
    const sameDayOfThisWeek = dayjs().day(preferredPurchase).toDate();
    // if the preferred purchase day is earlier than today, return the next weeks day
    if (dayjs(sameDayOfThisWeek).isBefore(dayjs())) {
      return dayjs().add(1, "week").day(preferredPurchase).toDate();
    }
    return sameDayOfThisWeek;
  });

  const form = createForm(() => ({
    defaultValues: {
      supplierId: props.product().suppliers.length > 0 ? props.product().suppliers[0].supplier.id : "",
      amount: props.product().reorderPoint ?? props.product().minimumStock,
      preferredDate: lastPreferredPurchaseDayOfWeek(),
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
        <span class="sr-only lg:not-sr-only">Reorder Now</span>
        <CalendarPlus class="size-4" />
      </DialogTrigger>
      <DialogContent class="flex flex-col gap-4">
        <DialogHeader class="!h-content">
          <DialogTitle class="text-left">Prepare to Reorder</DialogTitle>
          <DialogDescription class="text-left">
            Here you can prepare to reorder <span class="font-semibold">{props.product().name}</span>. Please choose a
            supplier, the amount and a preferred date.
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col items-center w-full border rounded-lg overflow-hidden">
          <form.Field name="supplierId">
            {(field) => (
              <div class="flex flex-col gap-4 items-center w-full border-b last:border-b-0">
                <For
                  each={props.product().suppliers}
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
                    initialFocusedDay={state().date ?? new Date()}
                    numberOfMonths={1}
                    disabled={(date) => dayjs(date).isBefore(dayjs().subtract(1, "day"))}
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
          <div class="flex flex-col gap-2 items-center justify-center w-full border-b last:border-b-0 p-4">
            <form.Field name="amount">
              {(field) => (
                <NumberField
                  value={field().state.value}
                  onRawValueChange={(value) => field().setValue(value)}
                  minValue={0}
                  class="!w-full !max-w-full"
                >
                  <NumberFieldLabel>Amount</NumberFieldLabel>
                  <NumberFieldGroup class="!w-full !max-w-full">
                    <NumberFieldInput class="!w-full !max-w-full" />
                    <NumberFieldIncrementTrigger />
                    <NumberFieldDecrementTrigger />
                  </NumberFieldGroup>
                </NumberField>
              )}
            </form.Field>
          </div>
        </div>
        <DialogFooter class="flex grow">
          <div class="flex flex-row items-center justify-end gap-2">
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
