import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { convertToSale } from "@/lib/api/orders";
import { useAction, useSubmission } from "@solidjs/router";
import { createForm } from "@tanstack/solid-form";
import Loader2 from "lucide-solid/icons/loader-2";
import Tickets from "lucide-solid/icons/tickets";
import { createSignal, For, Index, Show } from "solid-js";
import { toast } from "solid-sonner";

type ConvertToSaleForm = {
  products: Array<{
    id: string;
    quantity: number;
  }>;
};

type ConvertToSaleDialogProps = {
  orderId: string;
  customerId: string;
  saleId: string | null;
  products: Array<{
    product: {
      id: string;
      name: string;
      sku: string;
      stock: number;
    };
    quantity: number;
  }>;
};

export function ConvertToSaleDialog(props: ConvertToSaleDialogProps) {
  const [convertToSaleDialogOpen, setConvertToSaleDialogOpen] = createSignal(false);
  const convertToSaleAction = useAction(convertToSale);
  const isConvertingToSale = useSubmission(convertToSale);

  const convertForm = createForm(() => ({
    defaultValues: {
      products: (props.products ?? []).map((p) => ({
        id: p.product.id,
        quantity: Math.min(p.quantity, p.product.stock),
      })),
    } satisfies ConvertToSaleForm,
    onSubmit: async (state) => {
      if (!props.customerId) {
        toast.error("Failed to convert order to sale: Customer ID is missing");
        return;
      }
      return toast.promise(convertToSaleAction(props.orderId, props.customerId, state.value.products), {
        loading: "Converting order to sale...",
        success: () => {
          setConvertToSaleDialogOpen(false);
          return "Order converted to sale";
        },
        error: "Failed to convert order to sale",
      });
    },
  }));

  return (
    <Dialog
      open={convertToSaleDialogOpen()}
      onOpenChange={(v) => {
        setConvertToSaleDialogOpen(v);
        convertForm.reset();
      }}
    >
      <DialogTrigger as={Button} class="w-full" disabled={isConvertingToSale.pending || props.saleId !== null}>
        <Show when={isConvertingToSale.pending} fallback={<Tickets class="size-6" />}>
          <Loader2 class="size-6 animate-spin" />
        </Show>
        Convert to Sale
      </DialogTrigger>
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Convert Order to Sale</DialogTitle>
          <DialogDescription>
            Verify the quantities for each product before converting this order to a sale.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            convertForm.handleSubmit();
          }}
          class="space-y-4"
        >
          <div class="flex flex-col  max-h-[400px] overflow-y-auto border rounded-lg">
            <convertForm.Field name="products" mode="array">
              {(field) => (
                <Show when={field().state.value.length > 0}>
                  <Index each={field().state.value}>
                    {(_, index) => {
                      const product = props.products[index];
                      return (
                        <div class="flex flex-col gap-2 p-4 border-b last:border-b-0">
                          <div class="flex items-center justify-between">
                            <div class="flex flex-col">
                              <span class="font-medium">{product.product.name}</span>
                              <span class="text-sm text-muted-foreground">SKU: {product.product.sku}</span>
                              <span class="text-sm text-muted-foreground">Ordered: {product.quantity}</span>
                            </div>
                            <div class="flex flex-col items-end gap-1">
                              <span class="text-sm text-muted-foreground">
                                Available Stock: {product.product.stock ?? 0}
                              </span>
                              <div class="w-min">
                                <convertForm.Field name={`products[${index}].quantity`}>
                                  {(quantityField) => (
                                    <NumberField
                                      value={quantityField().state.value}
                                      onRawValueChange={(value) => quantityField().handleChange(value)}
                                      minValue={0}
                                      maxValue={product.product.stock}
                                      class="w-32"
                                    >
                                      <NumberFieldGroup>
                                        <NumberFieldDecrementTrigger />
                                        <NumberFieldInput class="px-4" />
                                        <NumberFieldIncrementTrigger />
                                      </NumberFieldGroup>
                                    </NumberField>
                                  )}
                                </convertForm.Field>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </Index>
                </Show>
              )}
            </convertForm.Field>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => {
                setConvertToSaleDialogOpen(false);
                convertForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              type="submit"
              disabled={
                isConvertingToSale.pending || convertForm.getFieldValue("products").some((p) => p.quantity <= 0)
              }
            >
              Convert to Sale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
