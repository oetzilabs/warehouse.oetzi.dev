import BarcodeScanner from "@/components/features/scanner/barcodescanner";
import { Skeleton } from "@/components/ui/skeleton";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/components/ui/text-field";
import { getProductBrands } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { createAsync } from "@solidjs/router";
import { For, Show, Suspense } from "solid-js";
import { useNewProductForm } from "./form";

export const Basics = () => {
  const form = useNewProductForm();
  const brands = createAsync(() => getProductBrands(), { deferStream: true });
  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="flex flex-col gap-2">
        <h2 class="text-lg font-semibold">Basic Information</h2>
        <p class="text-muted-foreground text-sm">
          Enter the main details for your product, such as name, barcode, SKU, and description.
        </p>
      </div>
      <div class="flex flex-col gap-4">
        <form.Field name="name">
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">
                Name <span class="text-red-500">*</span>
              </TextFieldLabel>
              <TextFieldInput class="h-9" placeholder="Product Name" />
            </TextField>
          )}
        </form.Field>
        <form.Field name="barcode">
          {(field) => (
            <div class="gap-2 flex flex-row items-end justify-center">
              <TextField
                value={field().state.value}
                onChange={(e) => field().setValue(e)}
                class="gap-2 flex flex-col w-full"
              >
                <TextFieldLabel class="capitalize pl-1">Barcode</TextFieldLabel>
                <TextFieldInput class="w-full" placeholder="Barcode" />
              </TextField>
              <BarcodeScanner
                onScan={(data) => {
                  field().handleChange(data);
                }}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="sku">
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">SKU</TextFieldLabel>
              <TextFieldInput class="h-9" placeholder="SKU" />
            </TextField>
          )}
        </form.Field>
        <form.Field name="description">
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Description</TextFieldLabel>
              <TextFieldTextArea placeholder="Product Description" autoResize />
            </TextField>
          )}
        </form.Field>
        <form.Field name="customsTariffNumber">
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Customs Tariff Number</TextFieldLabel>
              <TextFieldInput class="h-9" placeholder="Customs Tariff Number" />
            </TextField>
          )}
        </form.Field>
        <form.Field name="countryOfOrigin">
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Country of Origin</TextFieldLabel>
              <TextFieldInput class="h-9" placeholder="Country of Origin" />
            </TextField>
          )}
        </form.Field>
        <form.Field name="brand_id">
          {(field) => (
            <div class="gap-2 flex flex-col">
              <span class="capitalize pl-1 text-sm font-medium">Brand</span>
              <Suspense
                fallback={
                  <div class="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <Skeleton class="w-48 h-20" />
                    <Skeleton class="w-48 h-20" />
                  </div>
                }
              >
                <Show when={brands()}>
                  {(brandsList) => (
                    <div class="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      <For each={brandsList()}>
                        {(brand) => (
                          <div
                            class={cn(
                              "bg-muted-foreground/5 rounded-lg p-3 flex flex-col gap-1 border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer",
                              {
                                "text-white bg-indigo-600 hover:bg-indigo-600": field().state.value === brand.id,
                              },
                            )}
                            onClick={() => {
                              if (field().state.value === brand.id) {
                                field().setValue(null);
                              } else {
                                field().setValue(brand.id);
                              }
                            }}
                          >
                            <span class="text-sm font-medium">{brand.name}</span>
                            <span
                              class={cn("text-xs", {
                                "text-muted-foreground": field().state.value !== brand.id,
                              })}
                            >
                              {brand.description ?? ""}
                            </span>
                          </div>
                        )}
                      </For>
                    </div>
                  )}
                </Show>
              </Suspense>
            </div>
          )}
        </form.Field>
      </div>
    </section>
  );
};
