import { Button } from "@/components/ui/button";
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { createSupplier } from "@/lib/api/suppliers";
import { RouteDefinition, useAction, useNavigate, useSubmission } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type SupplierCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/suppliers/suppliers";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import { Show } from "solid-js";
import { toast } from "solid-sonner";
import { email, minLength, pipe, string } from "valibot";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    return { user, sessionToken };
  },
} as RouteDefinition;

export default function NewSupplierPage() {
  const navigate = useNavigate();
  const createSupplierAction = useAction(createSupplier);
  const isCreatingSupplier = useSubmission(createSupplier);

  const formOps = formOptions({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      bank_details: "",
      tax_id: "",
      code: "",
      payment_terms: "",
      website: "",
      status: "active",
    } satisfies Required<SupplierCreate>,
    defaultState: {
      canSubmit: false,
    },
  });

  const form = createForm(() => ({
    ...formOps,
    onSubmit: async (state) => {
      toast.promise(createSupplierAction(state.value), {
        loading: "Creating supplier...",
        success: "Supplier created successfully",
        error: "Failed to create supplier",
      });
    },
  }));

  return (
    <div class="container flex flex-col grow py-4 gap-4">
      <div class="flex items-center gap-4 justify-between w-full">
        <div class="flex items-center gap-4">
          <Button size="sm" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft class="size-4" />
            Back
          </Button>
          <h1 class="font-semibold leading-none">New Supplier</h1>
        </div>
        <div class="flex items-center gap-4">
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
            children={(state) => (
              <Button
                disabled={!state().canSubmit || isCreatingSupplier.pending}
                size="sm"
                onClick={() => form.handleSubmit()}
              >
                <Show
                  when={state().isSubmitting || isCreatingSupplier.pending}
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
            )}
          />
        </div>
      </div>
      <form
        class="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
                placeholder="Supplier name"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
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
            onChange: pipe(string(), email()),
            onBlur: pipe(string(), email()),
          }}
        >
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Email</TextFieldLabel>
              <TextFieldInput
                type="email"
                placeholder="Email address"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
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
                type="tel"
                placeholder="Phone number"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
              />
            </TextField>
          )}
        </form.Field>
        <form.Field name="bank_details" validators={{ onChange: pipe(string()), onBlur: pipe(string()) }}>
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Bank Details</TextFieldLabel>
              <TextFieldInput
                placeholder="Bank account details"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
              />
            </TextField>
          )}
        </form.Field>
        <form.Field name="tax_id" validators={{ onChange: pipe(string()), onBlur: pipe(string()) }}>
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Tax ID</TextFieldLabel>
              <TextFieldInput
                placeholder="Tax identification number"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
              />
            </TextField>
          )}
        </form.Field>
        <form.Field name="code" validators={{ onChange: pipe(string()), onBlur: pipe(string()) }}>
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Supplier Code</TextFieldLabel>
              <TextFieldInput
                placeholder="Unique supplier code"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
              />
            </TextField>
          )}
        </form.Field>
        <form.Field name="payment_terms" validators={{ onChange: pipe(string()), onBlur: pipe(string()) }}>
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Payment Terms</TextFieldLabel>
              <TextFieldInput
                placeholder="Payment terms and conditions"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
              />
            </TextField>
          )}
        </form.Field>
        <form.Field name="website" validators={{ onChange: pipe(string()), onBlur: pipe(string()) }}>
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Website</TextFieldLabel>
              <TextFieldInput
                type="url"
                placeholder="Company website URL"
                value={field().state.value}
                onInput={(e) => field().handleChange(e.currentTarget.value)}
                onBlur={field().handleBlur}
              />
            </TextField>
          )}
        </form.Field>
      </form>
    </div>
  );
}
