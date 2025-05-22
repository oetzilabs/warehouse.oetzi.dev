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
import { CalendarDate } from "@internationalized/date";
import { RouteDefinition, useAction, useNavigate, useSubmission } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type CatalogCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/catalogs/catalogs";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import { createMemo, Index, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { toast } from "solid-sonner";
import { minLength, pipe, string, transform } from "valibot";

dayjs.extend(isoWeek);

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
    <div class="container flex flex-col grow py-4 gap-4">
      <div class="flex items-center gap-4 justify-between w-full">
        <div class="flex items-center gap-4">
          <Button size="sm" variant="outline" onClick={() => navigate(-1)} class="h-8">
            <ArrowLeft class="size-4" />
            Back
          </Button>
          <h1 class="font-semibold leading-none">New Catalog</h1>
        </div>
        <div class="flex items-center gap-4">
          <Button
            disabled={form.state.isSubmitting}
            size="sm"
            class="h-8"
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
              when={isCreatingCatalog.pending}
              fallback={
                <>
                  <Plus class="size-4" />
                  Create
                </>
              }
            >
              <Loader2 class="size-4 animate-spin" />
              Creating
            </Show>
          </Button>
        </div>
      </div>
      <form
        class="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
        <form.Field
          name="name"
          validators={{
            onChange: pipe(string(), minLength(3)),
          }}
        >
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">
                Name <span class="text-red-500">*</span>
              </TextFieldLabel>
              <TextFieldInput placeholder="Catalog name" />
              <TextFieldErrorMessage>{field().state.meta.errors.join(", ")}</TextFieldErrorMessage>
            </TextField>
          )}
        </form.Field>
        <form.Field name="description" validators={{ onChange: pipe(string()) }}>
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Description</TextFieldLabel>
              <TextFieldInput placeholder="Description (optional)" />
              <TextFieldErrorMessage>{field().state.meta.errors.join(", ")}</TextFieldErrorMessage>
            </TextField>
          )}
        </form.Field>
        <div class="flex flex-col gap-4">
          <span class="text-sm font-medium pl-1">Date Range</span>
          <input
            type="date"
            value={form.state.values.startDate.toISOString()}
            onChange={(e) => form.setFieldValue("startDate", dayjs(e.target.value).toDate())}
          />
          <input
            type="date"
            value={form.state.values.endDate.toISOString()}
            onChange={(e) => form.setFieldValue("endDate", dayjs(e.target.value).toDate())}
          />
        </div>
      </form>
    </div>
  );
}
