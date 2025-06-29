import BarcodeScanner from "@/components/features/scanner/barcodescanner";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldErrorMessage,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from "@/components/ui/number-field";
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "@/components/ui/text-field";
import { useNewProductForm } from "./form";

export const Basics = () => {
  const { form } = useNewProductForm();
  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="flex flex-col gap-2 col-span-2">
        <h2 class="text-lg font-semibold">Basic Information</h2>
        <p class="text-muted-foreground text-sm">
          Enter the main details for your product, such as name, barcode, SKU, and description.
        </p>
      </div>
      <div class="flex flex-col gap-4  col-span-3">
        <form.Field name="product.name">
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">
                Name <span class="text-red-500">*</span>
              </TextFieldLabel>
              <TextFieldInput class="h-9" placeholder="Product Name" required />
            </TextField>
          )}
        </form.Field>
        <form.Field name="product.barcode">
          {(field) => (
            <div class="gap-2 flex flex-row items-end justify-center">
              <TextField
                value={field().state.value}
                onChange={(e) => field().setValue(e)}
                class="gap-2 flex flex-col w-full"
              >
                <TextFieldLabel class="capitalize pl-1">
                  Barcode<span class="text-red-500">*</span>
                </TextFieldLabel>
                <TextFieldInput class="w-full" placeholder="Barcode" required />
              </TextField>
              <BarcodeScanner
                onScan={(data) => {
                  field().handleChange(data);
                }}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="product.sku">
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">
                SKU<span class="text-red-500">*</span>
              </TextFieldLabel>
              <TextFieldInput class="h-9" placeholder="SKU" required />
            </TextField>
          )}
        </form.Field>
        <form.Field name="product.description">
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Description</TextFieldLabel>
              <TextFieldTextArea placeholder="Product Description" autoResize />
            </TextField>
          )}
        </form.Field>
        <form.Field name="product.customsTariffNumber">
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Customs Tariff Number</TextFieldLabel>
              <TextFieldInput class="h-9" placeholder="Customs Tariff Number" />
            </TextField>
          )}
        </form.Field>
        <form.Field name="product.countryOfOrigin">
          {(field) => (
            <TextField value={field().state.value} onChange={(e) => field().setValue(e)} class="gap-2 flex flex-col">
              <TextFieldLabel class="capitalize pl-1">Country of Origin</TextFieldLabel>
              <TextFieldInput class="h-9" placeholder="Country of Origin" />
            </TextField>
          )}
        </form.Field>
        <form.Field name="price.sellingPrice">
          {(field) => (
            <NumberField
              value={field().state.value}
              onRawValueChange={(e) => field().setValue(e)}
              class="w-full"
              minValue={0}
              step={0.01}
            >
              <NumberFieldLabel>Price</NumberFieldLabel>
              <NumberFieldGroup>
                <NumberFieldInput placeholder="Price" class="w-full" />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
            </NumberField>
          )}
        </form.Field>
        <form.Field name="price.currency">
          {(field) => (
            <Select
              value={field().state.value}
              onChange={(e) => {
                if (!e) return;
                field().setValue(e);
              }}
              options={["EUR", "USD", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD", "SEK", "DKK", "NOK", "BRL"]}
              placeholder="Select a currency..."
              itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>}
            >
              <SelectLabel>Currency</SelectLabel>
              <SelectTrigger aria-label="Currency" class="w-full">
                <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          )}
        </form.Field>
      </div>
    </section>
  );
};
