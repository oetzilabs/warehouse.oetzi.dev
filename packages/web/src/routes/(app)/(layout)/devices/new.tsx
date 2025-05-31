import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { createDevice, getDeviceTypes } from "@/lib/api/devices";
import { A, createAsync, useAction, useNavigate, useSubmission } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { minLength, pipe, string } from "valibot";

type DeviceSelect = {
  value: string;
  label: string;
};
export default function NewDevicePage() {
  const navigate = useNavigate();
  const deviceTypes = createAsync(() => getDeviceTypes(), { deferStream: true });
  const createDeviceAction = useAction(createDevice);
  const isCreatingDevice = useSubmission(createDevice);

  const formOps = formOptions({
    defaultValues: {
      name: "",
      type: {
        value: "",
        label: "Select device type...",
      },
    },
    defaultState: {
      canSubmit: false,
    },
  });

  const form = createForm(() => ({
    ...formOps,
    onSubmit: async (state) => {
      toast.promise(createDeviceAction({ name: state.value.name, typeId: state.value.type.value }), {
        loading: "Creating device...",
        success: (data) => {
          navigate(`/devices/${data.id}`);
          return "Device created successfully";
        },
        error: "Failed to create device",
      });
    },
  }));

  return (
    <div class="container py-4 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="outline" size="sm" as={A} href="/devices">
            <ArrowLeft class="size-4" />
            Back
          </Button>
          <h1 class="text-lg font-semibold">New Device</h1>
        </div>
      </div>

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
            onChange: pipe(string(), minLength(1, "Device name is required")),
            onBlur: pipe(string(), minLength(1, "Device name is required")),
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
                <Button type="submit" disabled={!state().canSubmit || state().isSubmitting}>
                  <Show when={state().isSubmitting} fallback="Create Device">
                    <Loader2 class="size-4 animate-spin" />
                    Creating Device...
                  </Show>
                </Button>
              </div>
            </>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
