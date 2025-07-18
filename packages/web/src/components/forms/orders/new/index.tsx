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
import X from "lucide-solid/icons/x";
import { createSignal, For, Index, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { CustomerSelect } from "./customer";

type ProductSelect = {
  value: string;
  label: string;
  price: number;
  currency: string;
  taxGroupName: string;
  taxGroupRate: number;
  disabled: boolean;
};

export function NewOrderForm(props: {
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
      <div class="flex flex-col gap-4 w-full border-b pb-8">
        <div class="flex flex-row gap-4 w-full">
          <div class="flex flex-col gap-4 w-full">
            <span class="font-bold">
              Customer <span class="text-red-500">*</span>
            </span>
            <span class="text-sm text-muted-foreground">The customer this order is for</span>
          </div>
          <div class="flex flex-col gap-4 w-full">
            <form.Field name="customer">
              {(field) => (
                <CustomerSelect
                  value={field().state.value}
                  onChange={(value) => field().handleChange(() => value)}
                  customers={props.customers}
                />
              )}
            </form.Field>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-4 w-full border-b py-8">
        <div class="flex flex-row gap-4 w-full">
          <div class="flex flex-col gap-4 w-full">
            <span class="font-bold">
              Products <span class="text-red-500">*</span>
            </span>
            <span class="text-sm text-muted-foreground">Please select the products for this order</span>
          </div>
          <div class="flex flex-col gap-4 w-full">
            <form.Field name="products" mode="array">
              {(field) => (
                <div class="flex flex-col gap-2">
                  <div class="flex flex-row items-center justify-between">
                    <div class="w-full" />
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
                            disabled: false,
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
                                    disabled: field().state.value.some((x) => x.product.value === p.product.id),
                                  }))}
                                  optionValue="value"
                                  optionTextValue="label"
                                  optionLabel="label"
                                  optionDisabled="disabled"
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
                              <X class="size-4" />
                            </Button>
                          </div>
                        )}
                      </Index>
                    </Show>
                  </Show>
                </div>
              )}
            </form.Field>
          </div>
        </div>
      </div>
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
                      <div class="flex flex-col gap-1 w-max">
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
              <Button
                size="sm"
                type="submit"
                disabled={!state().canSubmit || state().isSubmitting || isCreatingOrder.pending}
              >
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
