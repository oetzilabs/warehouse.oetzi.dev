import { Basics } from "@/components/forms/catalogs/new/basics";
import { DateRange } from "@/components/forms/catalogs/new/date-range";
import { NewCatalogFormProvider, useNewCatalogForm } from "@/components/forms/catalogs/new/form";
import { Products } from "@/components/forms/catalogs/new/products";
import { Button } from "@/components/ui/button";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getProducts } from "@/lib/api/products";
import { RouteDefinition, useNavigate } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async () => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const products = await getProducts();
    return { user, sessionToken, products };
  },
} as RouteDefinition;
const SubmitButton = () => {
  const { form, pending } = useNewCatalogForm();
  return (
    <form.Subscribe
      selector={(state) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
      })}
      children={(state) => (
        <Button
          disabled={!state().canSubmit || pending()}
          size="sm"
          onClick={() => {
            form
              .validateAllFields("submit")
              .then(() => {
                form.handleSubmit();
              })
              .catch(() => {
                toast.error("Failed to create catalog");
              });
          }}
        >
          <Show
            when={state().isSubmitting || pending()}
            fallback={
              <>
                <Plus class="size-4" />
                <span class="sr-only md:not-sr-only">Create</span>
              </>
            }
          >
            <Loader2 class="size-4 animate-spin" />
            Creating
          </Show>
        </Button>
      )}
    />
  );
};

const Form = () => {
  const { form } = useNewCatalogForm();

  return (
    <form
      class="flex flex-col w-full pb-10"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Basics />
      <div class="border-b my-8" />
      <DateRange />
      <div class="border-b my-8" />
      <Products />
      <div class="border-b my-8" />
      <form.Subscribe
        selector={(state) => ({ errors: state.errors })}
        children={(state) => (
          <Show when={state().errors.length > 0}>
            <div>
              <em>There was an error on the form: {state().errors.join(", ")}</em>
            </div>
          </Show>
        )}
      />
    </form>
  );
};

export default function NewCatalogPage() {
  const navigate = useNavigate();

  return (
    <div class="flex flex-row grow p-2">
      <NewCatalogFormProvider>
        <div class="w-full flex flex-col gap-4">
          <div class="flex items-center gap-2 justify-between w-full bg-background pb-2">
            <div class="flex items-center gap-4">
              <Button size="sm" variant="outline" class="bg-background px-2 md:px-3" onClick={() => navigate(-1)}>
                <ArrowLeft class="size-4" />
                <span class="sr-only lg:not-sr-only">Back to Catalogs</span>
              </Button>
              <h1 class="font-semibold leading-none">New Catalog</h1>
            </div>
            <div class="flex items-center gap-2">
              <SubmitButton />
            </div>
          </div>
          <Form />
        </div>
      </NewCatalogFormProvider>
    </div>
  );
}
