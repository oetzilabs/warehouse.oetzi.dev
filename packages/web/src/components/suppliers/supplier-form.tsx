import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
  TextFieldTextArea,
} from "@/components/ui/text-field";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type SupplierUpdate } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/suppliers/suppliers";
import Loader2 from "lucide-solid/icons/loader-2";
import { Component, Show } from "solid-js";
import { minLength, pipe, string } from "valibot";

interface SupplierFormProps {
  defaultValues: SupplierUpdate;
  onSubmit: (data: SupplierUpdate) => Promise<void>;
  submitText?: string;
  submittingText?: string;
}

export const SupplierForm: Component<SupplierFormProps> = (props) => {
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
      class="space-y-4 w-full"
      onSubmit={(e) => {
        e.preventDefault();
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
              placeholder="Supplier name"
              value={field().state.value}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
              required
            />
          </TextField>
        )}
      </form.Field>
      <form.Field name="email">
        {(field) => (
          <TextField class="gap-2 flex flex-col">
            <TextFieldLabel class="capitalize pl-1">
              Email <span class="text-red-500">*</span>
            </TextFieldLabel>
            <TextFieldInput
              placeholder="Supplier email"
              value={field().state.value ?? ""}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
              required
            />
          </TextField>
        )}
      </form.Field>
      <form.Field name="phone">
        {(field) => (
          <TextField class="gap-2 flex flex-col">
            <TextFieldLabel class="capitalize pl-1">Phone</TextFieldLabel>
            <TextFieldInput
              placeholder="Supplier phone"
              value={field().state.value ?? ""}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
            />
          </TextField>
        )}
      </form.Field>
      <form.Field name="website">
        {(field) => (
          <TextField class="gap-2 flex flex-col">
            <TextFieldLabel class="capitalize pl-1">Website</TextFieldLabel>
            <TextFieldInput
              placeholder="Website"
              value={field().state.value ?? ""}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
            />
          </TextField>
        )}
      </form.Field>
      <form.Field name="bank_details">
        {(field) => (
          <TextField class="gap-2 flex flex-col">
            <TextFieldLabel class="capitalize pl-1">Bank Details</TextFieldLabel>
            <TextFieldInput
              placeholder="Bank details"
              value={field().state.value ?? ""}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
            />
          </TextField>
        )}
      </form.Field>
      <form.Field name="payment_terms">
        {(field) => (
          <TextField class="gap-2 flex flex-col">
            <TextFieldLabel class="capitalize pl-1">Payment Terms</TextFieldLabel>
            <TextFieldTextArea
              placeholder="Payment terms"
              autoResize
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
          <Button type="submit" size="sm" disabled={!state().canSubmit || state().isSubmitting}>
            <Show when={state().isSubmitting} fallback={props.submitText ?? "Submit"}>
              <Loader2 class="size-4 animate-spin" />
              {props.submittingText ?? "Submitting..."}
            </Show>
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
};
