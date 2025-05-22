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
import { cn } from "@/lib/utils";
import { A, createAsync, revalidate, RouteDefinition, useParams } from "@solidjs/router";
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import PackageSearch from "lucide-solid/icons/package-search";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import X from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const products = getProductsByWarehouseId(props.params.whid);
    return { user, sessionToken, sales: products };
  },
} as RouteDefinition;

export default function ProductsPage() {
  const params = useParams();
  const data = createAsync(() => getProductsByWarehouseId(params.whid), { deferStream: true });
  const [selectedProducts, setSelectedProducts] = createSignal<ProductInfo[]>([]);
  const [previewVisible, setPreviewVisible] = createSignal(false);

  return (
    <Show when={data()}>
      {(productsList) => (
        <div class="container flex flex-col grow py-4">
          <div class="w-full flex flex-row h-full border rounded-xl">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full border-b  p-4 ">
                <h1 class="font-semibold leading-none">Products</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 h-8 rounded-r-none bg-background"
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
                    <DropdownMenuTrigger as={Button} size="sm" class="h-8 pl-2.5 rounded-l-none">
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
              <div class="flex flex-row gap-2 w-full grow px-4">
                <Show
                  when={productsList().length > 0}
                  fallback={
                    <div class="flex flex-col gap-2 w-full h-60 items-center justify-center bg-muted-foreground/5 border rounded-lg">
                      <div class="flex flex-col gap-4 items-center justify-center text-muted-foreground select-none">
                        <span class="text-sm">No products data available</span>
                      </div>
                    </div>
                  }
                >
                  <ProductsDataTable
                    data={() => productsList().map((o) => o.product)}
                    onSelectedProdcuts={(products) => {
                      setSelectedProducts(products);
                      if (products.length > 0) setPreviewVisible(true);
                      else setPreviewVisible(false);
                    }}
                  />
                </Show>
              </div>
            </div>
            <div
              class={cn("w-full lg:max-w-lg border-l lg:flex hidden flex-col grow", {
                "lg:!hidden": !previewVisible(),
              })}
            >
              <div class="w-full flex flex-row gap-4 items-center justify-between border-b p-4">
                <h2 class="font-semibold leading-none">Preview Products</h2>
                <Button
                  size="icon"
                  variant="secondary"
                  class="size-8"
                  onClick={() => {
                    setPreviewVisible(false);
                  }}
                >
                  <X class="size-4" />
                </Button>
              </div>
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
                      <h1 class="text-lg font-semibold mb-4">{product.name}</h1>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
