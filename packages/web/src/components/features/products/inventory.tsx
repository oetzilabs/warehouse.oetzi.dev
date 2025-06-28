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
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { getProductStock, updateProductStock } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { createAsync, useAction, useSubmission } from "@solidjs/router";
import { type BrandInfo } from "@warehouseoetzidev/core/src/entities/brands";
import { type ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import dayjs from "dayjs";
import Fuse from "fuse.js";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Loader2 from "lucide-solid/icons/loader-2";
import Pencil from "lucide-solid/icons/pencil";
import Plus from "lucide-solid/icons/plus";
import Settings from "lucide-solid/icons/settings-2";
import X from "lucide-solid/icons/x";
import { Accessor, createSignal, For, Show, Suspense } from "solid-js";
import { createStore } from "solid-js/store";
import { toast } from "solid-sonner";
import { Reorder } from "./reorder";

type InventoryProps = {
  product: Accessor<ProductInfo>;
};

export const Inventory = (props: InventoryProps) => {
  const productStockData = createAsync(() => getProductStock(props.product().id), { deferStream: true });
  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <Show when={productStockData()}>
          {(productStock) => (
            <div class="flex justify-between">
              <span class="text-sm font-medium">Stock</span>
              <div class="flex flex-row items-center gap-2">
                <span class="text-sm text-muted-foreground">{productStock() ?? "N/A"}</span>
                <Button variant="outline" size="icon" class="bg-background size-6" disabled>
                  <Pencil class="!size-3" />
                </Button>
              </div>
            </div>
          )}
        </Show>
        <div class="flex justify-between">
          <span class="text-sm font-medium">Min/Max/Reorder</span>
          <div class="flex flex-row items-center gap-2">
            <span class="text-sm text-muted-foreground">
              {props.product().minimumStock}/{props.product().maximumStock ?? "N/A"}/
              {props.product().reorderPoint ?? "N/A"}
            </span>
            <StockDialog
              id={props.product().id}
              minimumStock={props.product().organizations[0].minimumStock ?? 0}
              maximumStock={props.product().organizations[0].maximumStock ?? 0}
              reorderPoint={props.product().organizations[0].reorderPoint ?? 0}
            />
          </div>
        </div>
      </div>
      {/* <div class="flex flex-col">
        <Reorder
          product={() => ({
            ...props.product(),
            preferredDate: props.product().preferredDate ?? dayjs().add(3, "days").toDate(),
            reorderPoint: props.product().reorderPoint ?? 0,
            minimumStock: props.product().minimumStock ?? 0,
          })}
        />
      </div> */}
    </div>
  );
};

type StockDialogProps = {
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  id: string;
};

const StockDialog = (props: StockDialogProps) => {
  const [stockDialogOpen, setStockDialogOpen] = createSignal(false);
  const [stockSettings, setStockSettings] = createStore({
    minimumStock: props.minimumStock,
    maximumStock: props.maximumStock,
    reorderPoint: props.reorderPoint,
  });

  const updateProductStockAction = useAction(updateProductStock);
  const isUpdatingProductStock = useSubmission(updateProductStock);

  return (
    <Dialog open={stockDialogOpen()} onOpenChange={setStockDialogOpen}>
      <DialogTrigger as={Button} variant="outline" size="icon" class="bg-background size-6">
        <Settings class="!size-3" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock Settings</DialogTitle>
          <DialogDescription>Adjust stock levels and reorder points for this product</DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">Minimum Stock</span>
            <NumberField
              value={stockSettings.minimumStock}
              onRawValueChange={(value) => setStockSettings("minimumStock", value)}
            >
              <NumberFieldGroup>
                <NumberFieldInput />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
            </NumberField>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">Maximum Stock</span>
            <NumberField
              value={stockSettings.maximumStock}
              onRawValueChange={(value) => setStockSettings("maximumStock", value)}
            >
              <NumberFieldGroup>
                <NumberFieldInput />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
            </NumberField>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">Reorder Point</span>
            <NumberField
              value={stockSettings.reorderPoint}
              onRawValueChange={(value) => setStockSettings("reorderPoint", value)}
            >
              <NumberFieldGroup>
                <NumberFieldInput />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
            </NumberField>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStockDialogOpen(false)} size="sm">
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={isUpdatingProductStock.pending}
            onClick={() => {
              // TODO: Implement update stock settings API call
              toast.promise(updateProductStockAction(props.id, stockSettings), {
                loading: "Updating stock settings...",
                success: () => {
                  setStockDialogOpen(false);
                  return "Stock settings updated";
                },
                error: "Failed to update stock settings",
              });
            }}
          >
            <Show when={isUpdatingProductStock.pending} fallback={<span>Save Changes</span>}>
              Saving Changes...
            </Show>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
