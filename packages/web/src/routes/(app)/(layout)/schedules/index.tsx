import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getSchedules } from "@/lib/api/schedules";
import { cn } from "@/lib/utils";
import Calendar from "@corvu/calendar";
import { A, createAsync, RouteDefinition, RouteSectionProps } from "@solidjs/router";
import { type ScheduleInfo } from "@warehouseoetzidev/core/src/entities/schedules";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import ArrowRight from "lucide-solid/icons/arrow-right";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Loader2 from "lucide-solid/icons/loader-2";
import X from "lucide-solid/icons/x";
import { Accessor, Component, createMemo, createSignal, For, Index, Show, Suspense } from "solid-js";

dayjs.extend(isoWeek);

type ViewType = "month" | "week";

interface CustomCalendarProps {
  view: Accessor<ViewType>;
  schedules: Accessor<ScheduleInfo[]>;
}

const CustomCalendar: Component<CustomCalendarProps> = (props) => {
  const getSchedulesForDate = (date: Date) => {
    return props
      .schedules()
      .filter((schedule) =>
        dayjs(date).isBetween(dayjs(schedule.scheduleStart), dayjs(schedule.scheduleEnd), "day", "[]"),
      );
  };

  const [currentWeekDate, setCurrentWeekDate] = createSignal(dayjs().startOf("week"));

  const weekSchedules = createMemo(() => {
    // get the current weeks dates
    const start = currentWeekDate();
    const dates = Array.from({ length: 7 }, (_, i) => start.add(i, "days").toDate());

    return dates;
  });

  return (
    <Calendar mode="single" initialValue={new Date()} numberOfMonths={1}>
      {(calendar) => (
        <div class="flex flex-col gap-4 p-4 w-full">
          <header class="relative flex items-center justify-center p-4">
            <Show when={props.view() === "month"}>
              <Calendar.Nav action="prev-month" as={Button} variant="outline" size="icon" class="absolute left-0">
                <ArrowLeft class="size-4" />
              </Calendar.Nav>

              <Calendar.Label class="text-lg font-semibold" />

              <Calendar.Nav action="next-month" as={Button} variant="outline" size="icon" class="absolute right-0">
                <ArrowRight class="size-4" />
              </Calendar.Nav>
            </Show>
            <Show when={props.view() === "week"}>
              <Button
                variant="outline"
                size="icon"
                class="absolute left-0"
                onClick={() => {
                  setCurrentWeekDate((w) => w.subtract(1, "week"));
                }}
              >
                <ArrowLeft class="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                class="absolute right-0"
                onClick={() => {
                  setCurrentWeekDate((w) => w.add(1, "week"));
                }}
              >
                <ArrowRight class="size-4" />
              </Button>
            </Show>
          </header>
          <Show when={props.view() === "month"}>
            <Index each={calendar.months}>
              {(month) => (
                <div class="flex flex-col gap-0 w-full rounded-lg border overflow-clip ">
                  <div class="grid grid-cols-7 gap-0">
                    <Index each={calendar.weekdays}>
                      {(weekday) => (
                        <Calendar.HeadCell
                          as="div"
                          class="p-2 text-center text-xs font-normal text-muted-foreground border-b"
                        >
                          {dayjs(weekday()).format("ddd")}
                        </Calendar.HeadCell>
                      )}
                    </Index>
                  </div>
                  <Calendar.Table class="w-full grid grid-cols-7 gap-1 p-1" as="div">
                    <Index each={month().weeks}>
                      {(week) => (
                        <Index each={week()}>
                          {(day) => (
                            <Calendar.Cell
                              as="div"
                              class={cn(
                                "min-h-[120px] flex flex-col items-center justify-center",
                                "data-[outside-month]:bg-neutral-50 data-[outside-month]:text-neutral-400",
                                "data-[today]:bg-blue-50",
                              )}
                            >
                              <div class="border w-full h-full p-1 rounded-md space-y-1">
                                <Calendar.CellTrigger
                                  day={day()}
                                  as={Button}
                                  size="sm"
                                  variant="ghost"
                                  class={cn(
                                    "w-full rounded-sm",
                                    "data-[today]:border data-[today]:border-primary/50",
                                    "data-[selected]:bg-primary/50 data-[selected]:text-primary-foreground",
                                  )}
                                >
                                  {day().getDate()}
                                </Calendar.CellTrigger>
                                <div class="w-full h-full space-y-1">
                                  <For each={getSchedulesForDate(day())}>
                                    {(schedule) => (
                                      <div class="flex flex-col w-full">
                                        <For each={schedule.customers}>
                                          {(customer) => (
                                            <Popover>
                                              <PopoverTrigger
                                                as="div"
                                                class={cn(
                                                  "p-1.5 rounded text-xs cursor-pointer transition-colors hover:opacity-80 border",
                                                  {
                                                    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700":
                                                      customer.type === "pickup",
                                                    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700":
                                                      customer.type === "delivery",
                                                  },
                                                )}
                                              >
                                                <p class="font-semibold truncate">
                                                  {customer.customer.name} ({customer.type})
                                                </p>
                                                <p>
                                                  {dayjs(schedule.scheduleStart).format("h:mm A")} -{" "}
                                                  {dayjs(schedule.scheduleEnd).format("h:mm A")}
                                                </p>
                                              </PopoverTrigger>
                                              <PopoverContent
                                                class={cn("flex flex-col gap-4 w-full p-0", {
                                                  "bg-blue-100 border-blue-200 dark:bg-blue-900 dark:border-blue-700":
                                                    customer.type === "pickup",
                                                  "bg-emerald-100 border-emerald-200 dark:bg-emerald-900 dark:border-emerald-700":
                                                    customer.type === "delivery",
                                                })}
                                              >
                                                <div class="flex flex-col gap-2 w-full">
                                                  <div class="flex flex-row gap-4 w-full items-center justify-between p-2">
                                                    <span class="text-xs">{customer.customer.name}</span>
                                                    <span
                                                      class={cn(
                                                        "px-1 py-0.5 text-[10px] font-semibold rounded-sm uppercase w-max",
                                                        {
                                                          "bg-blue-200 text-blue-800": customer.type === "pickup",
                                                          "bg-emerald-200 text-emerald-800":
                                                            customer.type === "delivery",
                                                        },
                                                      )}
                                                    >
                                                      {customer.type}
                                                    </span>
                                                  </div>
                                                  <div
                                                    class={cn("flex flex-col border-t", {
                                                      "border-blue-200 dark:border-blue-700":
                                                        customer.type === "pickup",
                                                      "border-emerald-200 dark:border-emerald-700":
                                                        customer.type === "delivery",
                                                    })}
                                                  >
                                                    <For each={customer.order?.products ?? []}>
                                                      {(product) => (
                                                        <div class="text-xs flex flex-row gap-2 border-b last:border-b-0 p-2">
                                                          {product.quantity}x {product.product.name}
                                                        </div>
                                                      )}
                                                    </For>
                                                  </div>
                                                  <div class="flex flex-row gap-2 items-center p-2 justify-between">
                                                    <div class="text-xs">
                                                      {dayjs(
                                                        customer.order?.updatedAt ?? customer.order?.createdAt,
                                                      ).format("MMM DD, YYYY - h:mm A")}
                                                    </div>
                                                    <Button
                                                      as={A}
                                                      variant="outline"
                                                      href={`/orders/${customer.order?.id}`}
                                                      class="gap-2 bg-background text-xs !px-2 !py-1 rounded-sm !h-auto"
                                                    >
                                                      Open
                                                      <ArrowUpRight class="!size-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          )}
                                        </For>
                                      </div>
                                    )}
                                  </For>
                                </div>
                              </div>
                            </Calendar.Cell>
                          )}
                        </Index>
                      )}
                    </Index>
                  </Calendar.Table>
                </div>
              )}
            </Index>
          </Show>
          <Show when={props.view() === "week"}>
            <div class="flex flex-col gap-0 w-full rounded-lg border overflow-clip grow">
              <div class="grid grid-cols-7 gap-0">
                <Index each={calendar.weekdays}>
                  {(weekday) => (
                    <Calendar.HeadCell
                      as="div"
                      class="p-2 text-center text-xs font-normal text-muted-foreground border-b"
                    >
                      {dayjs(weekday()).format("ddd")}
                    </Calendar.HeadCell>
                  )}
                </Index>
              </div>
              <Calendar.Table class="w-full grid grid-cols-7 gap-1 p-1 grow" as="div">
                <Index each={weekSchedules()}>
                  {(day) => (
                    <Calendar.Cell
                      as="div"
                      class={cn(
                        "h-full flex flex-col items-center justify-center",
                        "data-[outside-month]:bg-neutral-50 data-[outside-month]:text-neutral-400",
                        "data-[today]:bg-blue-50",
                      )}
                    >
                      <div class="border w-full h-full p-1 rounded-md space-y-1">
                        <Calendar.CellTrigger
                          day={day()}
                          as={Button}
                          size="sm"
                          variant="ghost"
                          class={cn(
                            "w-full rounded-sm",
                            "data-[today]:border data-[today]:border-primary/50",
                            "data-[selected]:bg-primary/50 data-[selected]:text-primary-foreground",
                          )}
                        >
                          {day().getDate()}
                        </Calendar.CellTrigger>
                        <div class="w-full h-full space-y-1">
                          <For each={getSchedulesForDate(day())}>
                            {(schedule) => (
                              <div class="flex flex-col w-full">
                                <For each={schedule.customers}>
                                  {(customer) => (
                                    <Popover>
                                      <PopoverTrigger
                                        as="div"
                                        class={cn(
                                          "p-1.5 rounded text-xs cursor-pointer transition-colors hover:opacity-80 border",
                                          {
                                            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700":
                                              customer.type === "pickup",
                                            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700":
                                              customer.type === "delivery",
                                          },
                                        )}
                                      >
                                        <p class="font-semibold truncate">
                                          {customer.customer.name} ({customer.type})
                                        </p>
                                        <p>
                                          {dayjs(schedule.scheduleStart).format("h:mm A")} -{" "}
                                          {dayjs(schedule.scheduleEnd).format("h:mm A")}
                                        </p>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        class={cn("flex flex-col gap-4 w-full p-0", {
                                          "bg-blue-100 border-blue-200 dark:bg-blue-900 dark:border-blue-700":
                                            customer.type === "pickup",
                                          "bg-emerald-100 border-emerald-200 dark:bg-emerald-900 dark:border-emerald-700":
                                            customer.type === "delivery",
                                        })}
                                      >
                                        <div class="flex flex-col gap-2 w-full">
                                          <div class="flex flex-row gap-4 w-full items-center justify-between p-2">
                                            <span class="text-xs">{customer.customer.name}</span>
                                            <span
                                              class={cn(
                                                "px-1 py-0.5 text-[10px] font-semibold rounded-sm uppercase w-max",
                                                {
                                                  "bg-blue-200 text-blue-800": customer.type === "pickup",
                                                  "bg-emerald-200 text-emerald-800": customer.type === "delivery",
                                                },
                                              )}
                                            >
                                              {customer.type}
                                            </span>
                                          </div>
                                          <div
                                            class={cn("flex flex-col border-t", {
                                              "border-blue-200 dark:border-blue-700": customer.type === "pickup",
                                              "border-emerald-200 dark:border-emerald-700":
                                                customer.type === "delivery",
                                            })}
                                          >
                                            <For each={customer.order?.products ?? []}>
                                              {(product) => (
                                                <div class="text-xs flex flex-row gap-2 border-b last:border-b-0 p-2">
                                                  {product.quantity}x {product.product.name}
                                                </div>
                                              )}
                                            </For>
                                          </div>
                                          <div class="flex flex-row gap-2 items-center p-2 justify-between">
                                            <div class="text-xs">
                                              {dayjs(customer.order?.updatedAt ?? customer.order?.createdAt).format(
                                                "MMM DD, YYYY - h:mm A",
                                              )}
                                            </div>
                                            <Button
                                              as={A}
                                              variant="outline"
                                              href={`/orders/${customer.order?.id}`}
                                              class="gap-2 bg-background text-xs !px-2 !py-1 rounded-sm !h-auto"
                                            >
                                              Open
                                              <ArrowUpRight class="!size-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </For>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    </Calendar.Cell>
                  )}
                </Index>
              </Calendar.Table>
            </div>
          </Show>
        </div>
      )}
    </Calendar>
  );
};

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const schedules = await getSchedules();
    return { schedules, user, sessionToken };
  },
} satisfies RouteDefinition;

export default function SchedulesPage(
  props: RouteSectionProps<{
    schedules: ScheduleInfo[];
  }>,
) {
  const data = createAsync(() => getSchedules(), { deferStream: true, initialValue: props.data.schedules });

  const [view, setView] = createSignal<ViewType>("month");

  return (
    <div class="w-full border-t flex flex-row grow">
      <div class="w-full flex flex-col grow">
        <header class="p-4 flex justify-between items-center w-full">
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" as={A} href="/dashboard" class="bg-background">
              <ArrowLeft class="size-4" />
              Back
            </Button>
            <h1 class="font-medium">Schedules</h1>
          </div>
          <div class="flex space-x-2">
            <Button size="sm" onClick={() => setView("week")} variant={view() === "week" ? "default" : "outline"}>
              Week
            </Button>
            <Button size="sm" onClick={() => setView("month")} variant={view() === "month" ? "default" : "outline"}>
              Month
            </Button>
          </div>
        </header>
        <main class="flex flex-grow bg-background overflow-auto w-full">
          <Suspense
            fallback={
              <div class="flex flex-col items-center justify-center h-full w-full">
                <Loader2 class="size-4 animate-spin" />
              </div>
            }
          >
            <Show when={data()}>{(schedules) => <CustomCalendar view={view} schedules={schedules} />}</Show>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
