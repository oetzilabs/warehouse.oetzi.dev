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
  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="flex flex-col gap-2 col-span-2">
        <h2 class="text-lg font-semibold">Basic Information</h2>
        <p class="text-muted-foreground text-sm">
          Enter the main details for your product, such as name, barcode, SKU, and description.
        </p>
      </div>
      <div class="flex flex-col gap-4  col-span-3">
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
      </div>
    </section>
  );
};
