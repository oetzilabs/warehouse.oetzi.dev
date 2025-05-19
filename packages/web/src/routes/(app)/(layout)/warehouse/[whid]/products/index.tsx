import { ProductsDataTable } from "@/components/products/products-data-table";
import { Button } from "@/components/ui/button";
import { LineChart } from "@/components/ui/charts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getProductsByWarehouseId } from "@/lib/api/products";
import { A, createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import PackageSearch from "lucide-solid/icons/package-search";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const sales = getProductsByWarehouseId(props.params.whid);
    return { user, sessionToken, sales };
  },
} as RouteDefinition;

export default function SalesPage() {
  const params = useParams();
  const products = createAsync(() => getProductsByWarehouseId(params.whid), { deferStream: true });
  const [selectedProducts, setSelectedProducts] = createSignal<ProductInfo[]>([]);
  return (
    <Suspense fallback={<div class="p-4 w-full">Loading...</div>}>
      <Show when={products()}>
        {(productsList) => (
          <div class="w-full flex flex-row grow">
            <div class="w-full p-4 flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full">
                <h1 class="text-2xl font-bold leading-0">Products</h1>
                <div class="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="secondary"
                    class="size-8"
                    onClick={() => {
                      toast.promise(revalidate(getProductsByWarehouseId.keyFor(params.whid)), {
                        loading: "Refreshing products...",
                        success: "Products refreshed",
                        error: "Failed to refresh products",
                      });
                    }}
                  >
                    <RotateCw class="size-4" />
                  </Button>
                  <DropdownMenu placement="bottom-end">
                    <DropdownMenuTrigger as={Button} size="sm" class="h-8 pl-2">
                      <Plus class="size-4" />
                      Add Product
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem as={A} href={`/warehouse/${params.whid}/products/new`} class="cursor-pointer">
                        <Plus class="size-4" />
                        Create New
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Upload class="size-4" />
                        Import
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Show
                when={productsList().length > 0}
                fallback={
                  <div class="flex flex-col gap-2 w-full h-60 items-center justify-center bg-muted-foreground/5 border rounded-lg">
                    <div class="flex flex-col gap-4 items-center justify-center text-muted-foreground">
                      <span class="text-sm">No products data available</span>
                    </div>
                  </div>
                }
              >
                <ProductsDataTable
                  data={() => productsList().map((o) => o.product)}
                  onSelectedProdcuts={setSelectedProducts}
                />
              </Show>
            </div>
            <div class="w-full max-w-lg border-l flex flex-col grow">
              <For
                each={selectedProducts()}
                fallback={
                  <div class="p-4 w-full grow flex flex-col">
                    <div class="flex flex-col gap-4 items-center justify-center bg-muted-foreground/5 rounded-lg p-14 border text-muted-foreground">
                      <PackageSearch class="size-10 text-muted-foreground/50" stroke-width={1} />
                      <span class="text-sm">No products selected</span>
                    </div>
                  </div>
                }
              >
                {(product) => (
                  <div class="p-4 w-full flex flex-col gap-4">
                    <div class="flex items-center gap-4 justify-between w-full">
                      <h1 class="text-2xl font-bold mb-4">{product.name}</h1>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
}
