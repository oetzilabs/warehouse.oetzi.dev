import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemLabel,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TextField, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { getCustomers } from "@/lib/api/customers";
import { createOrder } from "@/lib/api/orders";
import { getProducts } from "@/lib/api/products";
import { A, createAsync, useAction, useNavigate, useSubmission } from "@solidjs/router";
import { createForm, formOptions } from "@tanstack/solid-form";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import Trash from "lucide-solid/icons/trash";
import { createSignal, For, Index, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

type CustomerSelect = {
  value: string;
  label: string;
};
type ProductSelect = {
  value: string;
  label: string;
  price: number;
  currency: string;
  taxGroupName: string;
  taxGroupRate: number;
};

function CustomerCombobox(props: {
  value: CustomerSelect;
  onChange: (value: CustomerSelect) => void;
  customers: { id: string; name: string }[];
}) {
  const options = props.customers.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  return (
    <div class="flex flex-col gap-2">
      <label class="capitalize pl-1 font-medium">
        Customer <span class="text-red-500">*</span>
      </label>
      <Combobox<CustomerSelect>
        options={options}
        optionValue="value"
        optionTextValue="label"
        optionLabel="label"
        placeholder="Select customer..."
        value={props.value}
        onChange={(value) => {
          if (!value) return;
          props.onChange(value);
        }}
        itemComponent={(props) => (
          <ComboboxItem item={props.item}>
            <ComboboxItemLabel>{props.item.rawValue.label}</ComboboxItemLabel>
            <ComboboxItemIndicator />
          </ComboboxItem>
        )}
      >
        <ComboboxControl aria-label="Customer" class="w-full">
          <ComboboxInput />
          <ComboboxTrigger />
        </ComboboxControl>
        <ComboboxContent />
      </Combobox>
    </div>
  );
}

function NewOrderForm(props: {
  customers: { id: string; name: string }[];
  products: {
    product: { id: string; name: string };
    sellingPrice: number;
    currency: string;
    taxGroupName: string;
    taxGroupRate: number;
  }[];
}) {
  const createOrderAction = useAction(createOrder);
  const isCreatingOrder = useSubmission(createOrder);
  const navigate = useNavigate();

  const formOps = formOptions({
    defaultValues: {
      customer: { value: "", label: "Select customer..." },
      products: [
        {
          product: { value: "", label: "Select product...", price: 0, currency: "" },
          quantity: 1,
        },
      ] as { product: ProductSelect; quantity: number }[],
    },
    defaultState: {
      canSubmit: false,
    },
  });

  const form = createForm(() => ({
    ...formOps,
    onSubmit: async (state) => {
      toast.promise(
        createOrderAction({
          customer_id: state.value.customer.value,
          products: state.value.products.map((p) => ({
            product_id: p.product.value,
            quantity: p.quantity,
          })),
        }),
        {
          loading: "Creating order...",
          success: (data) => {
            navigate(`/orders/${data.id}`);
            return "Order created successfully";
          },
          error: "Failed to create order",
        },
      );
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
      <form.Field name="customer">
        {(field) => (
          <CustomerCombobox
            value={field().state.value}
            onChange={(value) => field().handleChange(() => value)}
            customers={props.customers}
          />
        )}
      </form.Field>
      <form.Field name="products" mode="array">
        {(field) => (
          <div class="flex flex-col gap-2">
            <div class="flex flex-row items-center justify-between">
              <label class="capitalize pl-1 font-medium">Products</label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  field().pushValue({
                    product: {
                      value: "",
                      label: "Select product...",
                      price: 0,
                      currency: "",
                      taxGroupName: "",
                      taxGroupRate: 0,
                    },
                    quantity: 1,
                  })
                }
              >
                <Plus class="size-4" />
                Add Product
              </Button>
            </div>
            <Show when={props.products}>
              <Show when={field().state.value.length > 0}>
                <Index each={field().state.value}>
                  {(_, i) => (
                    <div class="flex flex-row gap-2 items-center mb-2">
                      <form.Field name={`products[${i}].product`}>
                        {(productField) => (
                          <Combobox<ProductSelect>
                            class="w-full max-w-full"
                            value={productField().state.value}
                            onChange={(value) => {
                              if (!value) return;
                              productField().handleChange(() => value);
                            }}
                            options={props.products.map((p) => ({
                              value: p.product.id,
                              label: p.product.name,
                              price: p.sellingPrice,
                              currency: p.currency,
                              taxGroupName: p.taxGroupName!,
                              taxGroupRate: p.taxGroupRate!,
                            }))}
                            optionValue="value"
                            optionTextValue="label"
                            optionLabel="label"
                            placeholder="Select product..."
                            itemComponent={(props) => (
                              <ComboboxItem item={props.item}>
                                <ComboboxItemLabel>
                                  {props.item.rawValue.label}{" "}
                                  <span class="text-xs text-muted-foreground">
                                    ({props.item.rawValue.price?.toFixed(2)} {props.item.rawValue.currency})
                                  </span>
                                </ComboboxItemLabel>
                                <ComboboxItemIndicator />
                              </ComboboxItem>
                            )}
                          >
                            <ComboboxControl aria-label="Product" class="w-full max-w-full">
                              <ComboboxInput />
                              <ComboboxTrigger />
                            </ComboboxControl>
                            <ComboboxContent />
                          </Combobox>
                        )}
                      </form.Field>
                      <form.Field name={`products[${i}].quantity`}>
                        {(quantityField) => (
                          <TextField class="w-24">
                            <TextFieldInput
                              type="number"
                              min={1}
                              value={quantityField().state.value}
                              onInput={(e) => quantityField().handleChange(Number(e.currentTarget.value))}
                              placeholder="Qty"
                              required
                            />
                          </TextField>
                        )}
                      </form.Field>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        onClick={() => field().removeValue(i)}
                        title="Remove"
                        class="!size-9 p-3"
                      >
                        <Trash class="size-4" />
                      </Button>
                    </div>
                  )}
                </Index>
              </Show>
            </Show>
          </div>
        )}
      </form.Field>
      <form.Subscribe
        selector={(state) => ({
          canSubmit: state.canSubmit,
          isSubmitting: state.isSubmitting,
          errors: state.errors,
          totalGroupedByCurrency: state.values.products.reduce(
            (acc, p) => {
              const currency = p.product.currency!;
              if (!acc[currency]) {
                acc[currency] = {
                  subtotal: 0,
                  total: 0,
                  tax: {
                    [p.product.taxGroupName]: p.product.taxGroupRate,
                  },
                };
              }

              const amount = p.product.price * p.quantity;
              acc[currency].subtotal += amount;
              acc[currency].total += amount;

              return acc;
            },
            {} as Record<
              string,
              {
                subtotal: number;
                tax: {
                  [key: string]: number;
                };
                total: number;
              }
            >,
          ),
        })}
      >
        {(state) => (
          <>
            <div class="flex flex-col gap-2">
              <div class="flex flex-row items-center justify-between">
                <label class="capitalize pl-1 font-medium">Total</label>
                <div class="flex flex-col items-center gap-2">
                  <For each={Object.entries(state().totalGroupedByCurrency)}>
                    {([currency, amounts]) => (
                      <div class="flex flex-col gap-1">
                        <span class="text-sm font-medium">{currency}</span>
                        <span class="text-sm text-muted-foreground">Subtotal</span>
                        <span class="text-sm font-medium">
                          {amounts.subtotal.toFixed(2)} {currency}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
            <Show when={state().errors.length > 0}>
              <div>
                <em>There was an error on the form: {state().errors.join(", ")}</em>
              </div>
            </Show>
            <div class="flex justify-end">
              <Button type="submit" disabled={!state().canSubmit || state().isSubmitting || isCreatingOrder.pending}>
                <Show when={state().isSubmitting || isCreatingOrder.pending} fallback="Create Order">
                  <Loader2 class="size-4 animate-spin" />
                  Creating Order...
                </Show>
              </Button>
            </div>
          </>
        )}
      </form.Subscribe>
    </form>
  );
}

// --- NewOrderPage (parent) ---
export default function NewOrderPage() {
  const customers = createAsync(() => getCustomers(), { deferStream: true });
  const products = createAsync(() => getProducts(), { deferStream: true });

  return (
    <div class="container py-4 flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="outline" size="sm" as={A} href="/orders">
            <ArrowLeft class="size-4" />
            Back
          </Button>
          <h1 class="text-lg font-semibold">New Order</h1>
        </div>
      </div>
      <Suspense
        fallback={
          <div class="flex items-center justify-center p-8 gap-2 text-sm text-muted-foreground">
            <Loader2 class="size-4 animate-spin" />
            <span class="text-sm">Loading customers & products...</span>
          </div>
        }
      >
        <Show when={customers() && products()}>
          <NewOrderForm
            customers={(customers() ?? []).map((c) => ({ id: c.id, name: c.name }))}
            products={(products() ?? []).map((p) => ({
              product: { id: p.product.id, name: p.product.name },
              sellingPrice: p.sellingPrice,
              currency: p.currency,
              taxGroupName: p.taxGroupName!,
              taxGroupRate: p.taxGroupRate!,
            }))}
          />
        </Show>
      </Suspense>
    </div>
  );
}
