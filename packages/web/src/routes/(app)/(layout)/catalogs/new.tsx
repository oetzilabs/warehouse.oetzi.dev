import { Button } from "@/components/ui/button";
import {
  DatePicker,
  DatePickerContent,
  DatePickerContext,
  DatePickerControl,
  DatePickerInput,
  DatePickerNextTrigger,
  DatePickerPositioner,
  DatePickerPrevTrigger,
  DatePickerRangeText,
  DatePickerTable,
  DatePickerTableBody,
  DatePickerTableCell,
  DatePickerTableCellTrigger,
  DatePickerTableHead,
  DatePickerTableHeader,
  DatePickerTableRow,
  DatePickerTrigger,
  DatePickerView,
  DatePickerViewControl,
  DatePickerViewTrigger,
} from "@/components/ui/date-picker";
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { createCatalog } from "@/lib/api/catalogs";
import { cn } from "@/lib/utils";
import Calendar from "@corvu/calendar";
import { CalendarDate } from "@internationalized/date";
import { RouteDefinition, useAction, useNavigate, useSubmission } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type CatalogCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/catalogs/catalogs";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isoWeek from "dayjs/plugin/isoWeek";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import ArrowRight from "lucide-solid/icons/arrow-right";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import { createMemo, Index, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { toast } from "solid-sonner";
import { minLength, pipe, string, transform } from "valibot";

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const { format: formatWeekdayLong } = new Intl.DateTimeFormat("en", { weekday: "long" });
const { format: formatWeekdayShort } = new Intl.DateTimeFormat("en", { weekday: "short" });
const { format: formatMonth } = new Intl.DateTimeFormat("en", { month: "long" });

export const route = {
  preload: () => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    return { user, sessionToken };
  },
} as RouteDefinition;

export default function NewCatalogPage() {
  const navigate = useNavigate();

  const createCatalogAction = useAction(createCatalog);
  const isCreatingCatalog = useSubmission(createCatalog);

  const formOps = formOptions({
    defaultValues: {
      name: "",
      description: "",
      startDate: dayjs().isoWeekday(1).startOf("week").toDate(),
      endDate: dayjs().isoWeekday(1).endOf("week").toDate(),
      isActive: true,
    } satisfies Required<CatalogCreate>,
    defaultState: {
      canSubmit: false,
    },
  });

  const form = createForm(() => ({
    ...formOps,
    onSubmit: async (state) => {
      toast.promise(createCatalogAction(state.value), {
        loading: "Creating catalog...",
        success: "Catalog created successfully",
        error: "Failed to create catalog",
      });
    },
  }));

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatDateToCalendarDate = (date: Date) => {
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };

  return (
    <div class="container flex flex-col grow py-0 gap-4 relative">
      <div class="sticky top-12 z-10 flex items-center gap-4 justify-between w-full bg-background pb-4">
        <div class="flex items-center gap-4">
          <Button size="sm" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft class="size-4" />
            Back
          </Button>
          <h1 class="font-semibold leading-none">New Catalog</h1>
        </div>
        <div class="flex items-center gap-4">
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
            children={(state) => (
              <Button
                disabled={!state().canSubmit || isCreatingCatalog.pending}
                size="sm"
                onClick={() => {
                  form
                    .validateAllFields("submit")
                    .then(() => {
                      form.handleSubmit();
                    })
                    .catch((e) => {
                      toast.error("Failed to create catalog");
                    });
                }}
              >
                <Show
                  when={state().isSubmitting || isCreatingCatalog.pending}
                  fallback={
                    <>
                      <Plus class="size-4" />
                      <span class="sr-only md:not-sr-only">Create</span>
                    </>
                  }
                >
                  <Loader2 class="size-4 animate-spin" />
                  Creating
                </Show>
              </Button>
            )}
          />
        </div>
      </div>
      <form
        class="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">
                Name <span class="text-red-500">*</span>
              </TextFieldLabel>
              <TextFieldInput
                placeholder="Catalog name"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
              />
            </TextField>
          )}
        </form.Field>
        <form.Field name="description">
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Description</TextFieldLabel>
              <TextFieldInput
                placeholder="Description (optional)"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
              />
            </TextField>
          )}
        </form.Field>
        <form.Subscribe selector={(state) => ({ startDate: state.values.startDate, endDate: state.values.endDate })}>
          {(state) => (
            <div class="flex flex-col gap-4">
              <span class="text-sm font-medium pl-1">Date Range</span>
              <div class="flex flex-row gap-2 w-full">
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
            </div>
          )}
        </form.Subscribe>

        <form.Subscribe
          selector={(state) => ({ errors: state.errors })}
          children={(state) => (
            <Show when={state().errors.length > 0}>
              <div>
                <em>There was an error on the form: {state().errors.join(", ")}</em>
              </div>
            </Show>
          )}
        />
      </form>
    </div>
  );
}
