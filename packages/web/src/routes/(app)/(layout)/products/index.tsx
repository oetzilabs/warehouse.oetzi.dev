import { ProductsList } from "@/components/lists/products";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getProducts } from "@/lib/api/products";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import PackageSearch from "lucide-solid/icons/package-search";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Upload from "lucide-solid/icons/upload";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const products = await getProducts();
    return { user, sessionToken, sales: products };
  },
} as RouteDefinition;

export default function ProductsPage() {
  const data = createAsync(() => getProducts(), { deferStream: true });

  return (
    <div class="container flex flex-col grow py-0 relative">
      <div class="w-full flex flex-row h-full">
        <div class="w-full flex flex-col gap-4">
          <div class="flex items-center gap-4 justify-between w-full ">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <PackageSearch class="size-4" />
              </div>
              <h1 class="font-semibold leading-none">Products</h1>
            </div>
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
                    <span class="sr-only md:not-sr-only">Create New</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload class="size-4" />
                    Import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div class="flex flex-col gap-4 w-full grow">
            <Suspense
              fallback={
                <div class="flex flex-col gap-4 w-full">
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                  <Skeleton class="w-full h-20" />
                </div>
              }
            >
              <Show when={data()}>
                {(productsList) => (
                  <Tabs defaultValue="all" class="w-full max-w-full">
                    <TabsList class="flex flex-row w-full items-center justify-start h-max">
                      <TabsTrigger
                        value="all"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-2"
                      >
                        All ({productsList().length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="active"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-2"
                      >
                        Active ({productsList().filter((p) => p.status !== "out_of_stock").length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="out_of_stock"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-2"
                      >
                        Out of Stock ({productsList().filter((p) => p.status === "out_of_stock").length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" class="pt-2">
                      <ProductsList data={productsList} />
                    </TabsContent>
                    <TabsContent value="active" class="pt-2">
                      <ProductsList data={() => productsList().filter((p) => p.status !== "out_of_stock")} />
                    </TabsContent>
                    <TabsContent value="out_of_stock" class="pt-2">
                      <ProductsList data={() => productsList().filter((p) => p.status === "out_of_stock")} />
                    </TabsContent>
                  </Tabs>
                )}
              </Show>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
