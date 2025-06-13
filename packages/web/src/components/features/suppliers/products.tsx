import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { A } from "@solidjs/router";
import { type SupplierInfo } from "@warehouseoetzidev/core/src/entities/suppliers";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import PackagePlus from "lucide-solid/icons/package-plus";
import Plus from "lucide-solid/icons/plus";
import ScanBarcode from "lucide-solid/icons/scan-barcode";
import { Accessor, For, Show } from "solid-js";

dayjs.extend(relativeTime);

type ProductsProps = {
  list: Accessor<(SupplierInfo["products"][number] & { isInSortiment: Date | undefined | null })[]>;
};

export const Products = (props: ProductsProps) => {
  return (
    <div class="flex flex-col border rounded-lg overflow-clip">
      <div class="flex flex-row items-center gap-2 justify-between p-4 py-2 pr-2 border-b bg-muted-foreground/5 dark:bg-muted/30">
        <h2 class="font-medium">Products</h2>
        <div class="flex flex-row items-center">
          <Button size="sm">
            <Plus class="size-4" />
            Add Product
          </Button>
        </div>
      </div>
      <div class="flex flex-col w-full">
        <Show when={props.list().length === 0}>
          <div class="flex flex-col gap-4 items-center justify-center p-10 col-span-full bg-muted-foreground/5">
            <span class="text-sm text-muted-foreground">No products added</span>
            <div class="flex flex-row gap-2 items-center justify-center">
              <Button size="sm">
                <PackagePlus class="size-4" />
                Assign Product
              </Button>
              <Button size="sm" variant="outline" class="bg-background">
                <ScanBarcode class="size-4" />
                Import
              </Button>
            </div>
          </div>
        </Show>
        <Show when={props.list().length > 0}>
          <div class="flex flex-col">
            <For each={props.list()}>
              {(product) => (
                <div class="flex flex-row gap-2 items-center justify-between border-b last:border-b-0 p-4">
                  <div class="flex flex-col gap-1">
                    <div class="flex flex-row items-center gap-2">
                      <span class="text-sm font-medium">{product.product.name}</span>
                      <Show when={product.isInSortiment}>
                        <Badge variant="outline" class="bg-rose-500 border-0 text-white">
                          Not in Sortiment
                        </Badge>
                      </Show>
                      <Show when={product.product.deletedAt}>
                        <Badge variant="outline" class="bg-rose-500 border-0">
                          Deleted
                        </Badge>
                      </Show>
                    </div>
                    <span class="text-xs text-muted-foreground">{product.product.sku}</span>
                  </div>
                  <div class="flex flex-row items-center gap-2">
                    <Button
                      size="sm"
                      as={A}
                      href={`/products/${product.product.id}`}
                      variant="outline"
                      class="bg-background"
                    >
                      View
                      <ArrowUpRight class="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};
