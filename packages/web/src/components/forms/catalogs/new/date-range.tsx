import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Calendar from "@corvu/calendar";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import ArrowRight from "lucide-solid/icons/arrow-right";
import { Index } from "solid-js";
import { useNewCatalogForm } from "./form";

dayjs.extend(isBetween);

const { format: formatWeekdayLong } = new Intl.DateTimeFormat("en", { weekday: "long" });
const { format: formatWeekdayShort } = new Intl.DateTimeFormat("en", { weekday: "short" });
const { format: formatMonth } = new Intl.DateTimeFormat("en", { month: "long" });

export const DateRange = () => {
  const { form } = useNewCatalogForm();
  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="flex flex-col gap-2 col-span-2">
        <h2 class="text-lg font-semibold">Date Range</h2>
        <p class="text-muted-foreground text-sm">Set the active period for this catalog.</p>
      </div>
      <div class="flex flex-col gap-4 col-span-3">
        <form.Subscribe selector={(state) => ({ startDate: state.values.startDate, endDate: state.values.endDate })}>
          {(state) => (
            <div class="flex flex-row gap-2 w-full border rounded-lg p-4">
              <Calendar
                mode="range"
                numberOfMonths={2}
                initialValue={{
                  from: state().startDate,
                  to: state().endDate,
                }}
                onValueChange={(date) => {
                  if (!date.from || !date.to) return;
                  form.setFieldValue("startDate", date.from);
                  form.setFieldValue("endDate", date.to);
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
                                                "bg-primary/10 text-primary/70": dayjs(day()).isBetween(
                                                  state().startDate,
                                                  state().endDate,
                                                ),
                                                "bg-primary text-white": dayjs().isSame(day(), "day"),
                                                "!bg-primary/50 !text-primary":
                                                  dayjs(day()).isSame(state().startDate, "day") ||
                                                  dayjs(day()).isSame(state().endDate, "day"),
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
    </section>
  );
};
