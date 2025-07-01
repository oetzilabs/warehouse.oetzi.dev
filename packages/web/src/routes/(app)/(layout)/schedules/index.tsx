import { Button } from "@/components/ui/button";
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
import Loader2 from "lucide-solid/icons/loader-2";
import { Accessor, Component, createSignal, For, Index, Show, Suspense } from "solid-js";

dayjs.extend(isoWeek);

type ViewType = "month" | "week";

interface CustomCalendarProps {
  view: ViewType;
  onSelectSchedule: (schedule: ScheduleInfo["customers"][number]) => void;
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

  return (
    <Calendar mode="single" initialValue={new Date()} numberOfMonths={1}>
      {(calendar) => (
        <div class="flex flex-col gap-4 p-4 w-full">
          <header class="relative flex items-center justify-center p-4">
            <Calendar.Nav action="prev-month" as={Button} variant="outline" size="icon" class="absolute left-0">
              <ArrowLeft class="size-4" />
            </Calendar.Nav>

            <Calendar.Label class="text-lg font-semibold" />

            <Calendar.Nav action="next-month" as={Button} variant="outline" size="icon" class="absolute right-0">
              <ArrowRight class="size-4" />
            </Calendar.Nav>
          </header>

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
                        {(day) => {
                          const cellSchedules = getSchedulesForDate(day());
                          return (
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
                                  <For each={cellSchedules}>
                                    {(schedule) => (
                                      <div class="flex flex-col w-full">
                                        <For each={schedule.customers}>
                                          {(customer) => (
                                            <div
                                              class={cn(
                                                "p-1.5 rounded text-xs cursor-pointer transition-colors hover:opacity-80",
                                                {
                                                  "bg-blue-100 text-blue-800": customer.type === "pickup",
                                                  "bg-green-100 text-green-800": customer.type === "delivery",
                                                },
                                              )}
                                              onClick={() => props.onSelectSchedule(customer)}
                                            >
                                              <p class="font-semibold truncate">
                                                {customer.customer.name} ({customer.type})
                                              </p>
                                              <p>
                                                {dayjs(schedule.scheduleStart).format("h:mm A")} -{" "}
                                                {dayjs(schedule.scheduleEnd).format("h:mm A")}
                                              </p>
                                            </div>
                                          )}
                                        </For>
                                      </div>
                                    )}
                                  </For>
                                </div>
                              </div>
                            </Calendar.Cell>
                          );
                        }}
                      </Index>
                    )}
                  </Index>
                </Calendar.Table>
              </div>
            )}
          </Index>
        </div>
      )}
    </Calendar>
  );
};

interface ScheduleSidebarProps {
  schedule: Accessor<ScheduleInfo["customers"][number] | null>;
  isOpen: Accessor<boolean>;
  onClose: () => void;
}

const ScheduleSidebar: Component<ScheduleSidebarProps> = (props) => {
  return (
    <div class="w-full max-w-xl flex flex-col border-l">
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between p-2 pl-4">
          <h2 class="font-semibold">Schedule Details</h2>
          <Button variant="ghost" size="icon" onClick={props.onClose}>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <div class="flex flex-col gap-4 w-full px-4">
          <Show when={props.schedule()}>
            {(schedule) => (
              <div class="flex flex-col gap-4 w-full">
                <span
                  class={cn("px-2 py-1 text-xs font-semibold rounded-full uppercase w-max", {
                    "bg-blue-200 text-blue-800": schedule().type === "pickup",
                    "bg-green-200 text-green-800": schedule().type === "delivery",
                  })}
                >
                  {schedule().type}
                </span>
                <div class="flex flex-col border rounded-lg">
                  <h3 class="font-semibold px-4 py-2 border-b">Products</h3>
                  <div class="flex flex-col gap-2 p-4">
                    <For each={schedule().order?.products ?? []}>
                      {(product) => (
                        <div class="flex flex-row gap-2 border-b last:border-b-0">
                          {product.quantity}x {product.product.name}
                        </div>
                      )}
                    </For>
                  </div>
                </div>
                {/* <Show when={schedule.notes}>
                        <div class="mt-4 p-2 bg-neutral-100 rounded">
                          <h4 class="font-semibold">Notes</h4>
                          <p>{schedule.notes}</p>
                        </div>
                      </Show>
                      <Show when={schedule.alerts}>
                        <div class="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded text-yellow-800">
                          <h4 class="font-semibold">Alert</h4>
                          <p>{schedule.alerts}</p>
                        </div>
                      </Show> */}
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
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
  const [selectedSchedule, setSelectedSchedule] = createSignal<ScheduleInfo["customers"][number] | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = createSignal(false);

  const handleSelectSchedule = (schedule: ScheduleInfo["customers"][number]) => {
    setSelectedSchedule(schedule);
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

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
            <Show when={data()}>
              {(schedules) => (
                <CustomCalendar view={view()} onSelectSchedule={handleSelectSchedule} schedules={schedules} />
              )}
            </Show>
          </Suspense>
        </main>
      </div>
      <ScheduleSidebar schedule={selectedSchedule} isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
    </div>
  );
}
