import { Button } from "@/components/ui/button";
import { TextField, TextFieldErrorMessage, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { createCustomer } from "@/lib/api/customers";
import { A, RouteDefinition, useAction, useNavigate, useSubmission } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import { type CustomerCreate } from "@warehouseoetzidev/core/src/drizzle/sql/schemas/customers/customers";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import { Show } from "solid-js";
import { toast } from "solid-sonner";
import { email, minLength, pipe, string } from "valibot";

export const route = {
  preload: () => {
    const user = getAuthenticatedUser();
    const sessionToken = getSessionToken();
    return { user, sessionToken };
  },
} as RouteDefinition;

export default function NewCustomerPage() {
  const navigate = useNavigate();
  const createCustomerAction = useAction(createCustomer);
  const isCreatingCustomer = useSubmission(createCustomer);

  const formOps = formOptions({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      image: "",
      status: "active",
    } satisfies Required<Omit<CustomerCreate, "id">>,
    defaultState: {
      canSubmit: false,
    },
  });

  const form = createForm(() => ({
    ...formOps,
    onSubmit: async (state) => {
      toast.promise(createCustomerAction(state.value), {
        loading: "Creating customer...",
        success: "Customer created successfully",
        error: "Failed to create customer",
      });
    },
  }));

  return (
    <div class="container flex flex-col grow py-0 gap-4">
      <div class="sticky top-12 z-10 flex items-center gap-4 justify-between w-full bg-background pb-4">
        <div class="flex items-center gap-4">
          <Button size="sm" variant="outline" as={A} href="/customers">
            <ArrowLeft class="size-4" />
            Back
          </Button>
          <h1 class="font-semibold leading-none">New Customer</h1>
        </div>
        <div class="flex items-center gap-4">
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
            children={(state) => (
              <Button
                disabled={!state().canSubmit || isCreatingCustomer.pending}
                size="sm"
                onClick={() => form.handleSubmit()}
              >
                <Show
                  when={state().isSubmitting || isCreatingCustomer.pending}
                  fallback={
                    <>
                      <Plus class="size-4" />
                      <span class="sr-only md:not-sr-only">Create</span>
                    </>
                  }
                >
                  <Loader2 class="size-4 animate-spin" />
                  <span class="sr-only md:not-sr-only">Creating</span>
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
                placeholder="Customer name"
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
        <form.Field name="image" validators={{ onChange: pipe(string()), onBlur: pipe(string()) }}>
          {(field) => (
            <TextField class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Image URL</TextFieldLabel>
              <TextFieldInput
                type="url"
                placeholder="Customer image URL"
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
