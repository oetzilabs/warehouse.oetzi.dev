import { Basics } from "@/components/forms/products/new/basics";
import { Brand } from "@/components/forms/products/new/brands";
import { Certificates } from "@/components/forms/products/new/certificates";
import { Conditions } from "@/components/forms/products/new/conditions";
import { NewProductFormProvider, useNewProductForm } from "@/components/forms/products/new/form";
import { Images } from "@/components/forms/products/new/images";
import { Labels } from "@/components/forms/products/new/labels";
import { Suppliers } from "@/components/forms/products/new/suppliers";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getCertificates } from "@/lib/api/certificates";
import { getProductLabels } from "@/lib/api/products";
import { getStorageConditions } from "@/lib/api/storage_conditions";
import { getSuppliers } from "@/lib/api/suppliers";
import { A, RouteDefinition } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import Sparkles from "lucide-solid/icons/sparkles";
import { createSignal, Show } from "solid-js";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const suppliers = await getSuppliers();
    const productLabels = await getProductLabels();
    const certs = await getCertificates();
    const storageConditions = await getStorageConditions();
    return {
      user,
      sessionToken,
      suppliers,
      productLabels,
      certs,
      storageConditions,
    };
  },
} as RouteDefinition;

export default function NewProductPage() {
  const [withAI, setWithAI] = createSignal(false);
  return (
    <div class="container flex flex-row grow py-0">
      <NewProductFormProvider>
        <div class="w-full flex flex-col gap-4">
          <div class="sticky top-12 z-10 flex items-center gap-2 justify-between w-full bg-background pb-2">
            <div class="flex items-center gap-4">
              <Button size="sm" variant="outline" class="bg-background px-2 md:px-3" as={A} href="/products">
                <ArrowLeft class="size-4" />
                <span class="sr-only lg:not-sr-only">Back to Products</span>
              </Button>
              <h1 class="font-semibold leading-none">New Product</h1>
            </div>
            <div class="flex items-center gap-2">
              <Show when={withAI()}>
                <Tooltip>
                  <TooltipTrigger
                    as={Button}
                    size="sm"
                    variant="outline"
                    class="bg-gradient-to-r from-indigo-400 to-purple-500 text-white"
                    disabled
                  >
                    <Sparkles class="size-4" />
                    Use AI
                  </TooltipTrigger>
                  <TooltipContent class="w-80 rounded-lg bg-background p-4 shadow-lg">
                    <p class="text-sm text-muted-foreground">
                      Generate product details using AI. This feature is still in development.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Show>
              <SubmitButton />
            </div>
          </div>
          <Form />
        </div>
      </NewProductFormProvider>
    </div>
  );
}

const SubmitButton = () => {
  const { form, pending } = useNewProductForm();
  return (
    <Button
      size="sm"
      onClick={async () => {
        console.log(form.state.values);
        await form.handleSubmit();
      }}
      disabled={pending()}
    >
      <Show
        when={pending()}
        fallback={
          <>
            <Plus class="size-4" />
            Add
          </>
        }
      >
        <Loader2 class="size-4 animate-spin" />
        Adding
      </Show>
    </Button>
  );
};

const Form = () => {
  const { form } = useNewProductForm();
  return (
    <form
      class="w-full grow flex flex-col pb-10"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit(e);
      }}
    >
      <Basics />
      <div class="border-b my-8" />
      <Brand />
      <div class="border-b my-8" />
      <Images />
      <div class="border-b my-8" />
      <Labels />
      <div class="border-b my-8" />
      <Conditions />
      <div class="border-b my-8" />
      <Certificates />
      <div class="border-b my-8" />
      <Suppliers />
    </form>
  );
};
