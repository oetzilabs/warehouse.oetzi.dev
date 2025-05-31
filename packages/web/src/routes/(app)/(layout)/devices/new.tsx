import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { createDevice } from "@/lib/api/devices";
import { A, useNavigate } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show } from "solid-js";
import { toast } from "solid-sonner";
import { minLength, pipe, string } from "valibot";

const DEVICE_TYPES = [
  // Printing & Labeling
  "thermal_printer",
  "label_printer",
  "receipt_printer",
  "industrial_printer",

  // Scanning & Reading
  "barcode_scanner",
  "qr_scanner",
  "rfid_reader",
  "document_scanner",

  // POS & Payment
  "cash_drawer",
  "card_reader",
  "payment_terminal",
  "pos_display",

  // Material Handling
  "handheld_terminal",
  "mobile_computer",
  "scale",
  "weighing_station",

  // Storage & Retrieval
  "automated_storage",
  "carousel_system",
  "vertical_lift",

  // Other Equipment
  "security_camera",
  "time_clock",
  "access_control",
  "environmental_sensor",
] as const;

export default function NewDevicePage() {
  const navigate = useNavigate();

  const formOps = formOptions({
    defaultValues: {
      name: "",
      type: "printer",
    },
    defaultState: {
      canSubmit: false,
    },
  });

  const form = createForm(() => ({
    ...formOps,
    onSubmit: async (state) => {
      try {
        await toast.promise(createDevice(state.value), {
          loading: "Creating device...",
          success: (data) => {
            navigate(`/devices/${data.id}`);
            return "Device created successfully";
          },
          error: "Failed to create device",
        });
      } catch (error) {
        console.error(error);
      }
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

        <form.Field
          name="type"
          validators={{
            onChange: pipe(string(), minLength(1, "Device type is required")),
            onBlur: pipe(string(), minLength(1, "Device type is required")),
          }}
        >
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">
                Type <span class="text-red-500">*</span>
              </TextFieldLabel>
              <Select
                value={field().state.value}
                onChange={(value) => {
                  if (!value) return;
                  field().handleChange(() => value);
                }}
                options={DEVICE_TYPES}
                placeholder="Select device type..."
                itemComponent={(props) => (
                  <SelectItem item={props.item}>
                    {props.item.rawValue
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </SelectItem>
                )}
              >
                <SelectTrigger aria-label="Device type" class="w-full">
                  <SelectValue<string>>
                    {(state) =>
                      state
                        .selectedOption()
                        ?.split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ") || "Select device type..."
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
              <Show when={!field().state.meta.isValid}>
                <TextFieldErrorMessage>{field().state.meta.errors[0]?.message}</TextFieldErrorMessage>
              </Show>
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
