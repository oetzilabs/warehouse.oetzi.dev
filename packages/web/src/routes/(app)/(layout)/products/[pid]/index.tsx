import { Loader } from "@/components/features/loader";
import { Actions } from "@/components/features/products/actions";
import { Certificates } from "@/components/features/products/certificates";
import { Codes } from "@/components/features/products/code";
import { Conditions } from "@/components/features/products/conditions";
import { ProductImages } from "@/components/features/products/images";
import { Inventory } from "@/components/features/products/inventory";
import { Labels } from "@/components/features/products/lables";
import { MarginRange } from "@/components/features/products/margin-range";
import { ProductMenu } from "@/components/features/products/menu";
import { PricingHistory } from "@/components/features/products/pricing-history";
import { Suppliers } from "@/components/features/products/suppliers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getProductById } from "@/lib/api/products";
import { A, createAsync, RouteDefinition, useParams, useSearchParams } from "@solidjs/router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Map from "lucide-solid/icons/map";
import PackageSearch from "lucide-solid/icons/package-search";
import { createMemo, For, Show } from "solid-js";

dayjs.extend(relativeTime);

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser();
    const sessionToken = getSessionToken();
    const product = getProductById(props.params.pid);
    return { user, sessionToken, product };
  },
} as RouteDefinition;

export default function ProductPage() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = createMemo(() => (searchParams.tab as string | undefined) ?? "codes");
  const setTab = (value: string | undefined) => {
    setSearchParams({ tab: value });
  };
  const product = createAsync(() => getProductById(params.pid), { deferStream: true });

  return (
    <Loader query={product}>
      {(productInfo) => (
        <div class="flex flex-col gap-0 relative px-4 h-full overflow-auto">
          <div class="flex flex-row items-center justify-between gap-0 w-full bg-background py-4 container">
            <div class="flex flex-row items-center gap-4">
              <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                <PackageSearch class="size-4" />
              </div>
              <h1 class="font-semibold leading-none">Product</h1>
            </div>
            <div class="flex flex-row items-center gap-2">
              <Button size="sm" as={A} href={`/map?products=${productInfo().id}`}>
                <Map class="size-4" />
                Show on Map
              </Button>
              <ProductMenu product={productInfo} />
            </div>
          </div>
          <div class="flex flex-col h-content gap-4 container">
            <div class="flex flex-col md:grid grid-cols-5 w-full grow gap-4">
              <div class="col-span-3 grow flex">
                <ProductImages product={productInfo} />
              </div>
              <div class="col-span-2 w-full grow flex gap-4">
                <div class="flex flex-col w-full grow gap-4">
                  <div class="flex flex-col gap-2 w-full">
                    <div class="flex flex-col w-full gap-4">
                      <div class="flex flex-col w-full gap-2">
                        <h2 class="md:text-2xl font-bold uppercase text-wrap">{productInfo().name}</h2>
                        <span class="text-sm text-muted-foreground">
                          {dayjs(productInfo().updatedAt ?? productInfo().createdAt).format("MMM DD, YYYY - HH:mm A")}
                        </span>
                      </div>
                      <span class="text-muted-foreground text-xs">{productInfo().description}</span>
                    </div>
                    <Show when={productInfo().deletedAt}>
                      <Badge variant="outline" class="bg-rose-500 border-0">
                        Deleted
                      </Badge>
                    </Show>
                    <Show when={!productInfo().isInSortiment}>
                      <Badge variant="outline" class="bg-rose-500 border-0 text-white">
                        Not in Sortiment
                      </Badge>
                    </Show>
                  </div>
                  <div class="flex flex-col gap-1 border-b py-0">
                    <div class="flex flex-col gap-1 pb-10">
                      <span class="text-3xl font-bold font-['Geist_Mono_Variable']">
                        {productInfo().sellingPrice.toFixed(2)} {productInfo().currency}
                      </span>
                    </div>
                    <Show when={productInfo().suppliers}>
                      {(suppliers) => (
                        <div class="flex flex-col gap-1 py-4">
                          <div class="flex flex-row gap-1 items-center justify-between">
                            <span class="text-sm font-medium">Bought at</span>
                            <div class="flex flex-row gap-1">
                              <For
                                each={suppliers().flatMap((s) => s.priceHistory)}
                                fallback={
                                  <span class="text-sm text-muted-foreground font-['Geist_Mono_Variable']">N/A</span>
                                }
                              >
                                {(p, i) => (
                                  <div class="flex flex-row">
                                    <span class="text-sm text-muted-foreground font-['Geist_Mono_Variable']">
                                      {(p.supplierPrice ?? 0).toFixed(2)} {productInfo().currency}
                                    </span>
                                    <Show when={i() < suppliers().length - 1}>
                                      <span class="text-sm text-muted-foreground">/</span>
                                    </Show>
                                  </div>
                                )}
                              </For>
                            </div>
                          </div>
                          <div class="flex flex-row gap-1 items-center justify-between">
                            <span class="text-sm font-medium">Margin</span>
                            <span class="text-sm text-muted-foreground font-['Geist_Mono_Variable']">
                              <MarginRange suppliers={suppliers()} sellingPrice={productInfo().sellingPrice} />
                            </span>
                          </div>
                        </div>
                      )}
                    </Show>
                  </div>
                  <div class="flex flex-col gap-1 border-b py-4">
                    <Inventory product={productInfo} />
                  </div>
                  <div class="flex flex-col gap-1 pt-8">
                    <Actions product={productInfo} />
                  </div>
                </div>
              </div>
            </div>
            <Tabs
              defaultValue="codes"
              class="w-full max-w-full grow flex flex-col"
              onChange={(value) => setTab(value)}
              value={tab()}
            >
              <TabsList class="flex flex-row w-full items-center justify-start h-max max-w-screen overflow-x-auto">
                <TabsTrigger value="codes">Codes</TabsTrigger>
                <TabsTrigger value="labels">Labels</TabsTrigger>
                <TabsTrigger value="conditions">Conditions</TabsTrigger>
                <TabsTrigger value="certificates">Certificates</TabsTrigger>
                <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="codes">
                <Codes product={productInfo} />
              </TabsContent>
              <TabsContent value="labels">
                <Labels product={productInfo} />
              </TabsContent>
              <TabsContent value="certificates">
                <Certificates product={productInfo} />
              </TabsContent>
              <TabsContent value="conditions">
                <Conditions product={productInfo} />
              </TabsContent>
              <TabsContent value="suppliers">
                <Suppliers product={productInfo} />
              </TabsContent>
              <TabsContent value="history">
                <PricingHistory product={productInfo} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </Loader>
  );
}
