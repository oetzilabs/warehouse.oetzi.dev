import { ProductsList } from "@/components/products-list";
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

  return (
    <Show when={data()}>
      {(productsList) => (
        <div class="container flex flex-col grow py-4">
          <div class="w-full flex flex-row h-full">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full ">
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
              <ProductsList
                data={() =>
                  productsList().sort((a, b) => {
                    // if deleted, put it at the end
                    if (a.deletedAt && !b.deletedAt) return 1;
                    if (!a.deletedAt && b.deletedAt) return -1;
                    return 0;
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
