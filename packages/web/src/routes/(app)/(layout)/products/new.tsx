import { Basics } from "@/components/forms/products/new/basics";
import { Brand } from "@/components/forms/products/new/brands";
import { Certificates } from "@/components/forms/products/new/certificates";
import { Conditions } from "@/components/forms/products/new/conditions";
import { useNewProductForm } from "@/components/forms/products/new/form";
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
  const form = useNewProductForm();
  return (
    <div class="container flex flex-row grow py-0">
      <div class="w-full flex flex-col gap-4">
        <div class="flex items-center gap-4 justify-between w-full">
          <div class="flex items-center gap-4">
            <Button size="sm" variant="outline" class="bg-background" as={A} href="/products">
              <ArrowLeft class="size-4" />
              Back to Products
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
            <Button size="sm" onClick={() => {}}>
              <Plus class="size-4" />
              Add
            </Button>
          </div>
        </div>
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
      </div>
    </div>
  );
}
