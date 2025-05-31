import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { getDeviceTypes } from "@/lib/api/devices";
import { createAsync } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type DeviceInfo, type DeviceUpdateInfo } from "@warehouseoetzidev/core/src/entities/devices";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show, Suspense, type Component } from "solid-js";
import { minLength, pipe, string } from "valibot";

type DeviceSelect = {
  value: string;
  label: string;
};

export type DeviceFormProps = {
  defaultValues: Omit<DeviceUpdateInfo, "type"> & {
    type: DeviceSelect;
  };
  onSubmit: (values: DeviceUpdateInfo) => Promise<void>;
  submitText?: string;
  submittingText?: string;
};

export const DeviceForm: Component<DeviceFormProps> = (props) => {
  const deviceTypes = createAsync(() => getDeviceTypes());
  const formOps = formOptions({
    defaultValues: props.defaultValues,
    defaultState: {
      canSubmit: false,
    },
  });

  const form = createForm(() => ({
    ...formOps,
    onSubmit: async (state) => {
      const { type: t, ...rest } = state.value;
      await props.onSubmit({
        ...rest,
        type_id: t.value,
      });
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
              placeholder="Device name"
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

      <form.Field name="description" validators={{ onChange: pipe(string()), onBlur: pipe(string()) }}>
        {(field) => (
          <TextField class="gap-2 flex flex-col">
            <TextFieldLabel class="capitalize pl-1">Description</TextFieldLabel>
            <TextFieldInput
              placeholder="Description (optional)"
              value={field().state.value ?? ""}
              onInput={(e) => field().handleChange(e.currentTarget.value)}
              onBlur={field().handleBlur}
            />
            <Show when={!field().state.meta.isValid}>
              <TextFieldErrorMessage>{field().state.meta.errors[0]?.message}</TextFieldErrorMessage>
            </Show>
          </TextField>
        )}
      </form.Field>

      <Suspense
        fallback={
          <div class="flex items-center justify-center p-8 text-sm text-muted-foreground">
            <Loader2 class="size-4 animate-spin" />
            <span class="text-sm">Loading...</span>
          </div>
        }
      >
        <Show when={deviceTypes()}>
          {(deviceTypes) => (
            <form.Field name="type">
              {(field) => (
                <Select<DeviceSelect>
                  value={field().state.value}
                  onChange={(value) => {
                    if (!value) return;
                    field().handleChange(() => value);
                  }}
                  options={deviceTypes().map((d) => ({ id: d.id, label: d.name, value: d.id }))}
                  optionValue="value"
                  optionTextValue="label"
                  placeholder="Select device type..."
                  itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
                >
                  <SelectLabel>Device Type</SelectLabel>
                  <SelectTrigger aria-label="Device type" class="w-full">
                    <SelectValue<DeviceSelect>>
                      {(state) => state.selectedOption()?.label || "Select device type..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              )}
            </form.Field>
          )}
        </Show>
      </Suspense>
      <form.Field name="status">
        {(field) => (
          <Select
            value={field().state.value}
            onChange={(value) => field().handleChange(value as DeviceInfo["status"])}
            onOpenChange={field().handleBlur}
            options={
              [
                "online",
                "offline",
                "unresponsive",
                "unknown",
                "shutting-down",
                "rebooting",
                "maintenance",
                "error",
              ] as DeviceInfo["status"][]
            }
            required
          >
            <SelectLabel>Status</SelectLabel>
            <SelectTrigger>
              <SelectValue<DeviceInfo["status"]>>{(state) => state.selectedOption() || "Select status..."}</SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        )}
      </form.Field>

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
