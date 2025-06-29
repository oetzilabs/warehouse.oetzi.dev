import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldErrorMessage,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from "@/components/ui/number-field";
import { getSuppliers } from "@/lib/api/suppliers";
import { cn } from "@/lib/utils";
import { A, createAsync, revalidate } from "@solidjs/router";
import type { AnyFieldApi, FieldApi } from "@tanstack/solid-form";
import { type NewProductFormData } from "@warehouseoetzidev/core/src/entities/products/schemas";
import dayjs from "dayjs";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import X from "lucide-solid/icons/x";
import { Accessor, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";
import { useNewProductForm } from "./form";

export const Suppliers = () => {
  const { form } = useNewProductForm();
  const suppliers = createAsync(() => getSuppliers(), { deferStream: true });

  return (
    <section class="p-0 grid grid-cols-1 md:grid-cols-5 gap-8">
      <div class="flex flex-col gap-2 col-span-2">
        <h2 class="text-lg font-semibold">Suppliers</h2>
        <p class="text-muted-foreground text-sm">
          Select suppliers for this product. You can choose multiple suppliers.
        </p>
      </div>
      <div class="col-span-3 flex flex-col gap-4">
        <form.Field name="suppliers" mode="array">
          {(suppliersField) => (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <Suspense
                fallback={
                  <div class="col-span-full w-full flex flex-col gap-4 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border">
                    <span class="text-muted-foreground text-sm">Loading suppliers...</span>
                  </div>
                }
              >
                <Show when={suppliers()} fallback={<NoSuppliersState />}>
                  {(suppliersList) => (
                    <For each={suppliersList()}>
                      {(s) => {
                        const idx = () => suppliersField().state.value.findIndex((x) => x.supplier === s.id);
                        const isSelected = () => idx() !== -1;

                        const handleSelect = () => {
                          suppliersField().pushValue({
                            supplier: s.id,
                            purchasePrice: 0,
                            currency: "EUR",
                          });
                        };

                        const handleDeselect = () => {
                          suppliersField().removeValue(idx());
                        };

                        return (
                          <SupplierCard
                            supplier={s}
                            suppliersField={suppliersField}
                            isSelected={isSelected}
                            selectedIndex={idx}
                            onSelect={handleSelect}
                            onDeselect={handleDeselect}
                          />
                        );
                      }}
                    </For>
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

const NoSuppliersState = () => (
  <div class="col-span-full w-full flex flex-col gap-4 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border">
    <span class="text-muted-foreground text-sm">You don't have any suppliers</span>
    <div class="flex flex-row gap-4 items-center justify-center">
      <Button
        size="sm"
        class="bg-background"
        variant="outline"
        onClick={() => {
          toast.promise(revalidate(getSuppliers.key), {
            loading: "Refreshing suppliers...",
            success: "Suppliers refreshed",
            error: "Failed to refresh suppliers",
          });
        }}
      >
        <RotateCw class="size-4" />
        Refresh
      </Button>
      <Button size="sm" as={A} href="/suppliers/new">
        <Plus class="size-4" />
        Add Supplier
      </Button>
    </div>
  </div>
);

interface Supplier {
  id: string;
  name: string;
  notes: { content: string }[];
  contacts: { email: string | null }[];
  createdAt: Date;
  updatedAt: Date | null;
}

interface SelectedSupplier {
  supplier: string;
  purchasePrice: number;
  currency: string;
}

interface SupplierCardProps {
  supplier: Supplier;
  suppliersField: Accessor<
    FieldApi<
      NewProductFormData,
      "suppliers",
      SelectedSupplier[],
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    >
  >; // Adjust type as per your form library
  isSelected: Accessor<boolean>;
  selectedIndex: Accessor<number>;
  onSelect: () => void;
  onDeselect: () => void;
}

export const SupplierCard = (props: SupplierCardProps) => {
  // Use a reactive `find` for the purchase price directly from the form state
  const currentPurchasePrice = () => {
    if (props.isSelected()) {
      return props.suppliersField().state.value.find((x) => x.supplier === props.supplier.id)?.purchasePrice ?? 0.0;
    }
    return 0.0;
  };

  return (
    <div
      class={cn(
        "bg-muted-foreground/5 dark:bg-muted/15 rounded-lg p-4 w-full cursor-pointer flex flex-col items-start justify-center border gap-2",
        {
          "!bg-indigo-600 hover:bg-indigo-600": props.isSelected(),
        },
      )}
    >
      <div class="flex flex-row items-center justify-between gap-2 w-full">
        <span
          class={cn("text-sm font-medium w-full truncate", {
            "text-white ": props.isSelected(),
          })}
        >
          {props.supplier.name}
        </span>
        <Button
          size="icon"
          variant="outline"
          class="bg-background !size-6"
          onClick={() => {
            if (props.isSelected()) {
              props.onDeselect();
            } else {
              props.onSelect();
            }
          }}
        >
          <Show when={props.isSelected()}>
            <X class="!size-3" />
          </Show>
          <Show when={!props.isSelected()}>
            <Plus class="!size-3" />
          </Show>
        </Button>
      </div>
      <For each={props.supplier.notes}>
        {(note) => (
          <span
            class={cn("text-xs text-muted-foreground text-center", {
              "text-white/70": props.isSelected(),
            })}
          >
            {note.content}
          </span>
        )}
      </For>
      <For each={props.supplier.contacts}>
        {(contact) => (
          <span
            class={cn("text-xs text-muted-foreground text-center", {
              "text-white/70": props.isSelected(),
            })}
          >
            {contact.email}
          </span>
        )}
      </For>
      <span
        class={cn("text-xs text-muted-foreground text-center", {
          "text-white/70": props.isSelected(),
        })}
      >
        {dayjs(props.supplier.updatedAt ?? props.supplier.createdAt).format("MMM DD, YYYY - h:mm A")}
      </span>
      <Show when={props.isSelected()}>
        <NumberField
          value={currentPurchasePrice().toFixed(2)}
          onChange={(e) => {
            if (props.isSelected()) {
              const n = Number(e);
              let nV = Number.isNaN(n) ? 0 : n;
              nV = Math.max(nV, 0);
              props.suppliersField().replaceValue(props.selectedIndex(), {
                supplier: props.supplier.id,
                purchasePrice: nV,
                currency: "EUR",
              });
            }
          }}
          class="w-full"
          minValue={0}
          step={0.01}
        >
          <NumberFieldLabel
            class={cn({
              "text-white/70": props.isSelected(),
            })}
          >
            Purchase Price
          </NumberFieldLabel>
          <NumberFieldGroup>
            <NumberFieldInput class="bg-background" />
            <NumberFieldIncrementTrigger />
            <NumberFieldDecrementTrigger />
          </NumberFieldGroup>
        </NumberField>
      </Show>
    </div>
  );
};
