import { ProductsList } from "@/components/lists/products";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getProducts } from "@/lib/api/products";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import { Show } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const products = getProducts();
    return { user, sessionToken, sales: products };
  },
} as RouteDefinition;

export default function ProductsPage() {
  const data = createAsync(() => getProducts(), { deferStream: true });

  return (
    <Show when={data()}>
      {(productsList) => (
        <div class="container flex flex-col grow py-8">
          <div class="w-full flex flex-row h-full">
            <div class="w-full flex flex-col gap-4">
              <div class="flex items-center gap-4 justify-between w-full ">
                <h1 class="font-semibold leading-none">Products</h1>
                <div class="flex items-center gap-0">
                  <Button
                    size="icon"
                    variant="outline"
                    class="w-9 rounded-r-none bg-background"
                    onClick={() => {
                      toast.promise(revalidate(getProducts.key), {
                        loading: "Refreshing products...",
                        success: "Products refreshed",
                        error: "Failed to refresh products",
                      });
                    }}
                  >
                    <RotateCw class="size-4" />
                  </Button>
                  <DropdownMenu placement="bottom-end">
                    <DropdownMenuTrigger as={Button} size="sm" class="pl-2.5 rounded-l-none">
                      <Plus class="size-4" />
                      Add Product
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem as={A} href={`/products/new`} class="cursor-pointer">
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
              <ProductsList data={productsList} />
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
