import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type CustomerUpdate } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/customers/customers";
import Loader2 from "lucide-solid/icons/loader-2";
import { Component, Show } from "solid-js";
import { minLength, pipe, string } from "valibot";

interface CustomerFormProps {
  defaultValues: CustomerUpdate;
  onSubmit: (data: CustomerUpdate) => Promise<void>;
  submitText?: string;
  submittingText?: string;
}

export const CustomerForm: Component<CustomerFormProps> = (props) => {
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
      class="space-y-4 w-full max-w-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{
          onChange: pipe(string(), minLength(1)),
          onBlur: pipe(string(), minLength(1)),
        }}
      >
        {(field) => (
          <TextField class="gap-2 flex flex-col">
            <TextFieldLabel class="capitalize pl-1">
              Name <span class="text-red-500">*</span>
            </TextFieldLabel>
            <TextFieldInput
              placeholder="Customer name"
              value={field().state.value}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
              required
            />
            <Show when={!field().state.meta.isValid}>
              <TextFieldErrorMessage>{field().state.meta.errors[0]?.message}</TextFieldErrorMessage>
            </Show>
          </TextField>
        )}
      </form.Field>
      <form.Field
        name="email"
        validators={{
          onChange: pipe(string(), minLength(1)),
          onBlur: pipe(string(), minLength(1)),
        }}
      >
        {(field) => (
          <TextField class="gap-2 flex flex-col">
            <TextFieldLabel class="capitalize pl-1">
              Email <span class="text-red-500">*</span>
            </TextFieldLabel>
            <TextFieldInput
              type="email"
              placeholder="Customer email"
              value={field().state.value}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
              required
            />
            <Show when={!field().state.meta.isValid}>
              <TextFieldErrorMessage>{field().state.meta.errors[0]?.message}</TextFieldErrorMessage>
            </Show>
          </TextField>
        )}
      </form.Field>
      <form.Field name="phone" validators={{ onChange: pipe(string()), onBlur: pipe(string()) }}>
        {(field) => (
          <TextField class="gap-2 flex flex-col">
            <TextFieldLabel class="capitalize pl-1">Phone</TextFieldLabel>
            <TextFieldInput
              placeholder="Customer phone"
              value={field().state.value ?? ""}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
            />
          </TextField>
        )}
      </form.Field>
      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
          errors: state.errors,
        })}
      >
        {(state) => (
          <>
            <Show when={state().errors.length > 0}>
              <div>
                <em>There was an error on the form: {state().errors.join(", ")}</em>
              </div>
            </Show>
            <div class="flex justify-end">
              <Button type="submit" size="sm" disabled={!state().canSubmit || state().isSubmitting}>
                <Show when={state().isSubmitting} fallback={props.submitText ?? "Submit"}>
                  <Loader2 class="size-4 animate-spin" />
                  {props.submittingText ?? "Submitting..."}
                </Show>
              </Button>
            </div>
          </>
        )}
      </form.Subscribe>
    </form>
  );
};
