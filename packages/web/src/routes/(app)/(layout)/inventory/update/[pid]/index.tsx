import { Alerts } from "@/components/features/inventory/alerts";
import { Button } from "@/components/ui/button";
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getInventory, getInventoryAlerts, updateInventoryForProduct } from "@/lib/api/inventory";
import { getProductById } from "@/lib/api/products";
import { A, createAsync, revalidate, RouteDefinition, useAction, useParams, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import { createForm, formOptions } from "@tanstack/solid-form";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import SaveIcon from "lucide-solid/icons/save";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

const BarcodeScanner = clientOnly(() => import("@/components/features/scanner/barcodescanner"));

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = await getSessionToken();
    const data = await getProductById(props.params.pid);
    return { user, sessionToken };
  },
} as RouteDefinition;

export default function UpdateProductInventoryPage() {
  const params = useParams();
  const data = createAsync(() => getProductById(params.pid), { deferStream: true });
  const updateInventoryForProductAction = useAction(updateInventoryForProduct);
  const isUpdatingInventoryForProduct = useSubmission(updateInventoryForProduct);

  return (
    <Show when={data()}>
      {(product) => (
        <div class="container flex flex-col grow py-0">
          <div class="w-full flex flex-row h-full gap-4">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <div class="flex flex-row items-center gap-2">
                  <Button variant="outline" size="sm" as={A} href="/inventory">
                    <ArrowLeft class="size-4" />
                    Back
                  </Button>
                  <h1 class="font-semibold leading-none">Update Inventory for {product().name}</h1>
                </div>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate([getProductById.key]), {
                        loading: "Refreshing inventory...",
                        success: "Inventory refreshed",
                        error: "Failed to refresh inventory",
                      });
                    }}
                  >
                    <RotateCw class="size-4" />
                  </Button>
                  <Button size="sm" class="pl-2.5 rounded-l-none">
                    <SaveIcon class="size-4" />
                    Save
                  </Button>
                </div>
              </div>
              <div class="flex flex-col gap-4 w-full grow">
                <UpdateProductInventoryForm
                  amount={0}
                  onSubmit={(data) => {
                    toast.promise(updateInventoryForProductAction(product().id, data), {
                      loading: "Updating inventory...",
                      success: "Inventory updated",
                      error: "Failed to update inventory",
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}

type UpdateProductInventoryFormProps = {
  amount: number;
  onSubmit?: (data: { amount: number; storageId: string }) => void;
  submitText?: string;
  submittingText?: string;
};

const UpdateProductInventoryForm = (props: UpdateProductInventoryFormProps) => {
  const formOps = formOptions({
    defaultValues: {
      amount: props.amount,
      storageId: "",
    },
    defaultState: {
      canSubmit: false,
    },
  });

  const form = createForm(() => ({
    ...formOps,
    onSubmit: async (state) => {
      await props.onSubmit?.(state.value);
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
      <div class="flex flex-row gap-2 items-end justify-between">
        <form.Field name="storageId">
          {(field) => (
            <>
              <TextField class="gap-2 flex flex-col w-full" disabled>
                <TextFieldLabel class="capitalize pl-1">
                  Storage <span class="text-red-500">*</span>
                </TextFieldLabel>
                <TextFieldInput
                  placeholder="Please scan a storage-barcode"
                  class="w-full max-w-full"
                  value={field().state.value}
                  required
                  disabled
                />
              </TextField>
              <BarcodeScanner
                onScan={(data) => field().handleChange(data)}
                fallback={
                  <Button size="lg" disabled>
                    <Loader2 class="size-4 animate-spin" />
                  </Button>
                }
              />
            </>
          )}
        </form.Field>
      </div>
      <form.Field
        name="amount"
        validators={{
          onChange: (value) => {
            const num = Number(value);
            if (isNaN(num)) return "Must be a number";
            if (num < 0) return "Cannot be negative";
            return undefined;
          },
        }}
      >
        {(field) => (
          <TextField class="gap-2 flex flex-col w-full">
            <TextFieldLabel class="capitalize pl-1">
              Amount <span class="text-red-500">*</span>
            </TextFieldLabel>
            <TextFieldInput
              type="number"
              min={0}
              placeholder="Enter inventory amount"
              class="w-full max-w-full"
              value={field().state.value}
              onInput={(e) => field().handleChange(Number(e.currentTarget.value))}
              onBlur={field().handleBlur}
              required
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
                <Show when={state().isSubmitting} fallback={props.submitText ?? "Update Inventory"}>
                  <Loader2 class="size-4 animate-spin" />
                  {props.submittingText ?? "Updating..."}
                </Show>
              </Button>
            </div>
          </>
        )}
      </form.Subscribe>
    </form>
  );
};
