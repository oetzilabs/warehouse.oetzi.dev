import { CustomersOrdersList } from "@/components/lists/orders";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getCustomerOrders } from "@/lib/api/orders";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import CheckCheck from "lucide-solid/icons/check-check";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import ShoppingCart from "lucide-solid/icons/shopping-cart";
import Tags from "lucide-solid/icons/tags";
import Trash from "lucide-solid/icons/trash";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const orders = await getCustomerOrders();
    return { user, sessionToken, orders };
  },
} as RouteDefinition;

export default function CustomerOrdersPage() {
  const data = createAsync(() => getCustomerOrders(), { deferStream: true });

  return (
    <div class="flex flex-col-reverse md:flex-row w-full h-full gap-0 overflow-auto lg:overflow-hidden">
      <div class="w-full flex flex-row h-content gap-4 p-4 border-r-0 md:border-r md:overflow-auto">
        <div class="w-full flex flex-col gap-4">
          <div class="flex items-center gap-4 justify-between w-full bg-background">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <ShoppingCart class="size-4" />
              </div>
              <h1 class="font-semibold leading-none">Customer Orders</h1>
            </div>
            <div class="flex items-center gap-0">
              <Button
                size="icon"
                variant="outline"
                class="w-9 rounded-r-none bg-background"
                onClick={() => {
                  toast.promise(revalidate(getCustomerOrders.key), {
                    loading: "Refreshing orders...",
                    success: "Orders refreshed",
                    error: "Failed to refresh orders",
                  });
                }}
              >
                <RotateCw class="size-4" />
              </Button>
              <Button size="sm" class="pl-2.5 rounded-l-none" as={A} href="/orders/new">
                <Plus class="size-4" />
                <span class="sr-only md:not-sr-only">Create</span>
              </Button>
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
                {(os) => (
                  <Tabs defaultValue="clean" class="w-full max-w-full flex flex-col gap-2">
                    <TabsList class="flex flex-row w-full items-center justify-start h-max">
                      <TabsTrigger
                        value="clean"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-4"
                      >
                        <Tags class="size-4" />
                        <span class="sr-only md:not-sr-only">
                          Orders ({os().filter((o) => !["completed", "deleted"].includes(o.status)).length})
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="completed"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-4"
                      >
                        <CheckCheck class="size-4" />
                        <span class="sr-only md:not-sr-only">
                          Completed ({os().filter((o) => o.status === "completed").length})
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="deleted"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-4"
                      >
                        <Trash class="size-4" />
                        <span class="sr-only md:not-sr-only">
                          Deleted ({os().filter((o) => o.status === "deleted" || o.deletedAt).length})
                        </span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="all"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-4"
                      >
                        <Tags class="size-4" />
                        <span class="sr-only md:not-sr-only">All ({os().length})</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="clean">
                      <CustomersOrdersList
                        data={() => os().filter((o) => !["deleted", "completed"].includes(o.status))}
                      />
                    </TabsContent>
                    <TabsContent value="all">
                      <CustomersOrdersList data={() => os().filter((o) => o.status !== "deleted" || !o.deletedAt)} />
                    </TabsContent>
                    <TabsContent value="completed">
                      <CustomersOrdersList data={() => os().filter((o) => o.status === "completed")} />
                    </TabsContent>
                    <TabsContent value="deleted">
                      <CustomersOrdersList data={() => os().filter((o) => o.status === "deleted" || o.deletedAt)} />
                    </TabsContent>
                  </Tabs>
                )}
              </Show>
            </Suspense>
          </div>
        </div>
      </div>
      <div class="flex flex-col w-full md:w-[500px] p-4 md:overflow-auto border-b md:border-b-0 h-content"></div>
    </div>
  );
}
