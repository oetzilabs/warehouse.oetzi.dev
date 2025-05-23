import { Button } from "@/components/ui/button";
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { createForm, formOptions } from "@tanstack/solid-form";
import {
  type CatalogCreate,
  type CatalogUpdate,
} from "@warehouseoetzidev/core/src/drizzle/sql/schemas/catalogs/catalogs";
import dayjs from "dayjs";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show, type Component } from "solid-js";
import { minLength, pipe, string } from "valibot";

type CatalogUpdateFormProps = {
  defaultValues: CatalogUpdate;
  onSubmit: (values: CatalogUpdate) => Promise<void>;
  submitText?: string;
  submittingText?: string;
};

export const CatalogForm: Component<CatalogUpdateFormProps> = (props) => {
  const formOps = formOptions({
    defaultValues: props.defaultValues,
    defaultState: {
      canSubmit: false,
    },
  });

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
        <input
          type="date"
          value={dayjs(form.state.values.startDate).format("YYYY-MM-DD")}
          onChange={(e) => form.setFieldValue("startDate", dayjs(e.target.value).toDate())}
        />
        <input
          type="date"
          value={dayjs(form.state.values.endDate).format("YYYY-MM-DD")}
          onChange={(e) => form.setFieldValue("endDate", dayjs(e.target.value).toDate())}
        />
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
              <Button type="submit" disabled={!state().canSubmit || state().isSubmitting}>
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
