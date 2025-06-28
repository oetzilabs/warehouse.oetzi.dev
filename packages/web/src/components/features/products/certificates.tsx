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

type CertificatesProps = {
  product: Accessor<ProductInfo>;
};

export const Certificates = (props: CertificatesProps) => {
  return (
    <div class="flex flex-col gap-4 py-2">
      <div class="flex flex-row items-center gap-4 justify-between ">
        <div class="flex flex-row items-center gap-2 justify-end w-full">
          <Button variant="outline" size="sm" class="bg-background" disabled>
            <Plus class="size-4" />
            Add Certificate
          </Button>
        </div>
      </div>
      <div class="flex flex-col rounded-lg border">
        <For
          each={props.product().certs}
          fallback={
            <div class="flex flex-col items-center justify-center p-8">
              <span class="text-sm text-muted-foreground">No certificates added.</span>
            </div>
          }
        >
          {(cert) => (
            <div class="flex flex-col gap-1 p-4">
              <span class="text-sm text-muted-foreground">{cert.cert?.name ?? "N/A"}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
