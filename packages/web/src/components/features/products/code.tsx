import { Button } from "@/components/ui/button";
import { clientOnly } from "@solidjs/start";
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import Copy from "lucide-solid/icons/copy";
import Loader2 from "lucide-solid/icons/loader-2";
import Plus from "lucide-solid/icons/plus";
import X from "lucide-solid/icons/x";
import { Accessor, For, Show } from "solid-js";
import { toast } from "solid-sonner";

const Barcode = clientOnly(() => import("@/components/barcode"));
const QRCode = clientOnly(() => import("@/components/qrcode"));

type CodesProps = {
  product: Accessor<ProductInfo>;
};

export const Codes = (props: CodesProps) => {
  return (
    <div class="flex flex-col gap-4 py-2">
      <div class="flex flex-row ">
        <div class="flex flex-row items-center gap-2 justify-end w-full">
          <Button
            variant="outline"
            size="sm"
            class="bg-background"
            onClick={() => {
              toast.promise(navigator.clipboard.writeText(props.product().sku ?? ""), {
                loading: "Copying Barcode...",
                success: `Barcode '${props.product().sku}' copied to clipboard`,
                error: "Failed to copy Barcode",
              });
            }}
          >
            <Copy class="size-4" />
            Copy Barcode
          </Button>
        </div>
      </div>
      <div class="flex flex-col md:flex-row gap-10 items-center justify-center p-4">
        <Barcode
          value={props.product().sku ?? ""}
          fallback={
            <span class="h-32 w-full items-center justify-center flex flex-col bg-muted-foreground/10 rounded-lg">
              <Loader2 class="size-4 animate-spin" />
            </span>
          }
        />
        <QRCode
          value={props.product().sku ?? ""}
          fallback={
            <span class="size-40 items-center justify-center flex flex-col bg-muted-foreground/10 rounded-lg">
              <Loader2 class="size-4 animate-spin" />
            </span>
          }
        />
      </div>
    </div>
  );
};
