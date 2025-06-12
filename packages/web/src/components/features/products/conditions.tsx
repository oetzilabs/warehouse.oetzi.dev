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
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { assignBrand, getProductBrands } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { createAsync, useAction, useSubmission } from "@solidjs/router";
import { type BrandInfo } from "@warehouseoetzidev/core/src/entities/brands";
import { type ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import Fuse from "fuse.js";
import Loader2 from "lucide-solid/icons/loader-2";
import Pencil from "lucide-solid/icons/pencil";
import Plus from "lucide-solid/icons/plus";
import { Accessor, createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

type ConditionsProps = {
  product: Accessor<ProductInfo>;
};

export const Conditions = (props: ConditionsProps) => {
  return (
    <div class="flex flex-col gap-2 border rounded-lg overflow-clip">
      <div class="flex flex-row items-center gap-4 justify-between border-b bg-muted-foreground/5 dark:bg-muted/30 p-4 ">
        <h2 class="font-medium">Condition</h2>
        <div class="flex flex-row items-center gap-2">
          <Button variant="outline" size="sm" class="bg-background">
            <Plus class="size-4" />
            Add Condition
          </Button>
        </div>
      </div>
      <For
        each={props.product().stco}
        fallback={
          <div class="flex flex-col items-center justify-center p-8">
            <span class="text-sm text-muted-foreground">No conditions added.</span>
          </div>
        }
      >
        {(stco) => (
          <div class="flex flex-col gap-1 p-4">
            <span class="text-sm text-muted-foreground">{stco.condition?.name ?? "N/A"}</span>
          </div>
        )}
      </For>
    </div>
  );
};
