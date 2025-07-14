import { PurchasesList } from "@/components/lists/orders";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getPurchases } from "@/lib/api/purchases";
import { A, createAsync, revalidate, RouteDefinition } from "@solidjs/router";
import { type SupplierPurchaseInfo } from "@warehouseoetzidev/core/src/entities/suppliers";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import Tags from "lucide-solid/icons/tags";
import { Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser();
    const sessionToken = getSessionToken();
    const orders = getPurchases();
    return { user, sessionToken, orders };
  },
} as RouteDefinition;

export default function PurchasesPage() {
  const data = createAsync(() => getPurchases(), { deferStream: true });

  return (
    <div class="flex flex-row w-full grow p-2 gap-2">
      <div class="w-full flex flex-row h-full gap-4">
        <div class="w-full flex flex-col bg-background">
          <div class="flex items-center gap-2 justify-between w-full bg-background pb-2">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <Tags class="size-4" />
              </div>
              <h1 class="font-semibold leading-none">Purchases</h1>
            </div>
            <div class="flex items-center gap-0">
              <Button
                size="icon"
                variant="outline"
                class="w-9 rounded-r-none bg-background"
                onClick={() => {
                  toast.promise(revalidate(getPurchases.key), {
                    loading: "Refreshing purchases...",
                    success: "Purchases refreshed",
                    error: "Failed to refresh purchases",
                  });
                }}
              >
                <RotateCw class="size-4" />
              </Button>
              <Button size="sm" class="pl-2.5 rounded-l-none" as={A} href="/purchases/new">
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
                {(ps) => (
                  <Tabs defaultValue="clean" class="w-full max-w-full">
                    <TabsList class="flex flex-row w-full items-center justify-start h-max">
                      <TabsTrigger
                        value="clean"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-2"
                      >
                        Purchases ({ps().filter((o) => !["completed", "deleted"].includes(o.status)).length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="completed"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-2"
                      >
                        Completed ({ps().filter((o) => o.status === "completed").length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="deleted"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-2"
                      >
                        Deleted ({ps().filter((o) => o.status === "deleted" || o.deletedAt).length})
                      </TabsTrigger>
                      <TabsTrigger
                        value="all"
                        class="data-[selected]:text-primary data-[selected]:border-primary gap-2"
                      >
                        All ({ps().length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="clean">
                      <PurchasesList data={() => ps().filter((o) => !["completed", "deleted"].includes(o.status))} />
                    </TabsContent>
                    <TabsContent value="completed">
                      <PurchasesList data={() => ps().filter((o) => o.status === "completed")} />
                    </TabsContent>
                    <TabsContent value="deleted">
                      <PurchasesList data={() => ps().filter((o) => o.status === "deleted" || o.deletedAt)} />
                    </TabsContent>
                    <TabsContent value="all">
                      <PurchasesList data={() => ps()} />
                    </TabsContent>
                  </Tabs>
                )}
              </Show>
            </Suspense>
          </div>
        </div>
      </div>
      <div class="hidden md:flex w-px h-full bg-border"></div>
      <div class="w-0 md:w-[500px] h-full"></div>
    </div>
  );
}
