import { Button } from "@/components/ui/button";
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { cn } from "@/lib/utils";
import Calendar from "@corvu/calendar";
import { CalendarDate } from "@internationalized/date";
import { createForm, formOptions } from "@tanstack/solid-form";
import {
  type CatalogCreate,
  type CatalogUpdate,
} from "@warehouseoetzidev/core/src/drizzle/sql/schemas/catalogs/catalogs";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isoWeek from "dayjs/plugin/isoWeek";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import ArrowRight from "lucide-solid/icons/arrow-right";
import Loader2 from "lucide-solid/icons/loader-2";
import { Index, Show, type Component } from "solid-js";
import { Portal } from "solid-js/web";
import { toast } from "solid-sonner";
import { date, minLength, pipe, string } from "valibot";

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

type CatalogUpdateFormProps = {
  defaultValues: CatalogUpdate;
  onSubmit: (values: CatalogUpdate) => Promise<void>;
  submitText?: string;
  submittingText?: string;
};

const { format: formatWeekdayLong } = new Intl.DateTimeFormat("en", { weekday: "long" });
const { format: formatWeekdayShort } = new Intl.DateTimeFormat("en", { weekday: "short" });
const { format: formatMonth } = new Intl.DateTimeFormat("en", { month: "long" });

export const CatalogForm: Component<CatalogUpdateFormProps> = (props) => {
  const formOps = formOptions({
    defaultValues: props.defaultValues,
    defaultState: {
      canSubmit: false,
    },
  });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatDateToCalendarDate = (date: Date) => {
    return new CalendarDate(
      date.getFullYear(),
      date.getMonth() + 1, // months are 1-based in CalendarDate
      date.getDate(),
    );
  };

  const form = createForm(() => ({
    ...formOps,
    onSubmit: async (state) => {
      await props.onSubmit(state.value);
    },
  }));

  return (
    <form
      class="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{
          onChange: pipe(string(), minLength(3)),
          onBlur: pipe(string(), minLength(3)),
        }}
      >
        {(field) => (
          <TextField class="gap-2 flex flex-col">
            <TextFieldLabel class="capitalize pl-1">
              Name <span class="text-red-500">*</span>
            </TextFieldLabel>
            <TextFieldInput
              placeholder="Catalog name"
              value={field().state.value}
              onInput={(e) => field().handleChange(e.target.value)}
              onBlur={field().handleBlur}
              required
            />
            <Show when={!field().state.meta.isValid}>
              <TextFieldErrorMessage>{field().state.meta.errors[0]?.message}</TextFieldErrorMessage>
            </Show>
          </TextField>
        )}
      </form.Field>

      <form.Field name="description" validators={{ onChange: pipe(string()), onBlur: pipe(string()) }}>
        {(field) => (
          <TextField class="gap-2 flex flex-col">
            <TextFieldLabel class="capitalize pl-1">Description</TextFieldLabel>
            <TextFieldInput
              placeholder="Description (optional)"
              value={field().state.value ?? ""}
              onInput={(e) => field().handleChange(e.target.value)}
              onBlur={field().handleBlur}
            />
            <Show when={!field().state.meta.isValid}>
              <TextFieldErrorMessage>{field().state.meta.errors[0]?.message}</TextFieldErrorMessage>
            </Show>
          </TextField>
        )}
      </form.Field>

      <div class="flex flex-col gap-4">
        <span class="text-sm font-medium pl-1">Date Range</span>
        <div class="flex flex-row gap-2 w-full">
          <Calendar
            mode="range"
            numberOfMonths={2}
            initialValue={{
              from: form.state.values.startDate ?? new Date(),
              to: form.state.values.endDate ?? new Date(),
            }}
            onValueChange={(date) => {
              if (!date.from || !date.to) return;
              toast.info(
                "Date range updated successfully:" + date.from.toDateString() + " to " + date.to.toDateString(),
              );
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
                  size="sm"
                  class="size-8 absolute left-0"
                  variant="secondary"
                  type="button"
                >
                  <ArrowLeft class="size-4" />
                </Calendar.Nav>
                <Calendar.Nav
                  action="next-month"
                  aria-label="Go to next month"
                  as={Button}
                  size="sm"
                  class="size-8 absolute right-0"
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
                                          class={cn("inline-flex h-8 w-full bg-background", {
                                            "bg-primary/10 text-primary/70": dayjs(day()).isBetween(
                                              form.state.values.startDate,
                                              form.state.values.endDate,
                                            ),
                                            "bg-primary text-white": dayjs().isSame(day(), "day"),
                                            "!bg-primary/50 !text-primary":
                                              dayjs(day()).isSame(form.state.values.startDate, "day") ||
                                              dayjs(day()).isSame(form.state.values.endDate, "day"),
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

      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
          errors: state.errors,
        })}
        children={(state) => (
          <>
            <Show when={state().errors.length > 0}>
              <div>
                <em>There was an error on the form: {state().errors.join(", ")}</em>
              </div>
            </Show>
            <div class="flex justify-end">
              <Button type="submit" size="sm" disabled={!state().canSubmit || state().isSubmitting} class="h-8">
                <Show when={state().isSubmitting} fallback={props.submitText ?? "Submit"}>
                  <Loader2 class="size-4 animate-spin" />
                  {props.submittingText ?? "Submitting..."}
                </Show>
              </Button>
            </div>
          </>
        )}
      />
    </form>
  );
};
