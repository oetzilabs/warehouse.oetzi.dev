import { useUser } from "@/components/providers/User";
import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from "@/components/ui/number-field";
import { changeWarehouseDimensions } from "@/lib/api/warehouses";
import { useAction, useSubmission } from "@solidjs/router";
import { createForm } from "@tanstack/solid-form";
import Loader2 from "lucide-solid/icons/loader-2";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

type WarehouseSettingsFormProps = {
  onSubmit: (values: {
    dimensions: {
      width: number;
      height: number;
    };
  }) => void;
};

export default function WarehouseSettingsForm(props: WarehouseSettingsFormProps) {
  const user = useUser();
  const changeWarehouseDimensionsAction = useAction(changeWarehouseDimensions);
  const isChangingWarehouseDimensions = useSubmission(changeWarehouseDimensions);

  const form = createForm(() => ({
    defaultValues: {
      dimensions: {
        width: user.currentWarehouse()!.dimensions?.width ?? 0,
        height: user.currentWarehouse()!.dimensions?.height ?? 0,
      },
    },
    onSubmit: (values) => {
      const id = user.currentWarehouse()?.id;
      if (!id) {
        toast.error("Please select a warehouse first.");
        return;
      }
      const d = values.value.dimensions;
      const combinedPromise = new Promise(async (resolve, reject) => {
        await changeWarehouseDimensionsAction({ ...d, id });
        props.onSubmit(form.state.values);
        return resolve(form.state.values);
      });
      toast.promise(combinedPromise, {
        loading: "Changing warehouse dimensions...",
        success: "Warehouse dimensions changed successfully.",
        error: "Error changing warehouse dimensions",
      });
    },
  }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form
          .validateAllFields("submit")
          .then(() => {
            form.handleSubmit();
          })
          .catch((err) => {
            toast.error(err.message);
          });
      }}
      class="flex flex-col gap-2"
    >
      <form.Field name="dimensions.width">
        {(field) => (
          <NumberField
            class="w-full"
            defaultValue={0}
            value={field().state.value}
            onRawValueChange={(v) => {
              if (Number.isNaN(v)) {
                form.setFieldValue("dimensions.width", () => 0);
                return;
              }
              form.setFieldValue("dimensions.width", () => v);
            }}
          >
            <NumberFieldLabel>Width</NumberFieldLabel>
            <NumberFieldGroup>
              <NumberFieldInput placeholder="Width" />
              <NumberFieldIncrementTrigger />
              <NumberFieldDecrementTrigger />
            </NumberFieldGroup>
          </NumberField>
        )}
      </form.Field>
      <form.Field name="dimensions.height">
        {(field) => (
          <NumberField
            class="w-full"
            defaultValue={0}
            value={field().state.value}
            onRawValueChange={(v) => {
              if (Number.isNaN(v)) {
                form.setFieldValue("dimensions.height", () => 0);
                return;
              }
              form.setFieldValue("dimensions.height", () => v);
            }}
          >
            <NumberFieldLabel>Height</NumberFieldLabel>
            <NumberFieldGroup>
              <NumberFieldInput placeholder="Height" />
              <NumberFieldIncrementTrigger />
              <NumberFieldDecrementTrigger />
            </NumberFieldGroup>
          </NumberField>
        )}
      </form.Field>
      <div class="flex flex-row gap-2 items-center justify-end w-full">
        <form.Subscribe
          selector={(state) => ({
            dimensions: state.values.dimensions,
          })}
        >
          {(state) => (
            <Button size="sm" class="w-max" type="submit" disabled={isChangingWarehouseDimensions.pending}>
              <Show
                when={!isChangingWarehouseDimensions.pending}
                fallback={
                  <>
                    Saving...
                    <Loader2 class="size-4 animate-spin" />
                  </>
                }
              >
                Save changes
              </Show>
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
