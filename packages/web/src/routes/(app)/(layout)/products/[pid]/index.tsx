import { Actions } from "@/components/features/products/actions";
import { Certificates } from "@/components/features/products/certificates";
import { Codes } from "@/components/features/products/code";
import { Conditions } from "@/components/features/products/conditions";
import { ProductImages } from "@/components/features/products/images";
import { Inventory } from "@/components/features/products/inventory";
import { Labels } from "@/components/features/products/lables";
import { MarginRange } from "@/components/features/products/margin-range";
import { PricingHistory } from "@/components/features/products/pricing-history";
import { Suppliers } from "@/components/features/products/suppliers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { deleteProduct, getProductById, reAddProduct } from "@/lib/api/products";
import { A, createAsync, RouteDefinition, useAction, useNavigate, useParams, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import Map from "lucide-solid/icons/map";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Plus from "lucide-solid/icons/plus";
import RulerDimensionLine from "lucide-solid/icons/ruler-dimension-line";
import Weight from "lucide-solid/icons/weight";
import X from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

dayjs.extend(relativeTime);

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser({ skipOnboarding: true });
    const sessionToken = getSessionToken();
    const product = getProductById(props.params.pid);
    return { user, sessionToken, product };
  },
} as RouteDefinition;

export default function ProductPage() {
  const params = useParams();
  const navigate = useNavigate();
  const product = createAsync(() => getProductById(params.pid), { deferStream: true });
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);

  const deleteProductAction = useAction(deleteProduct);
  const isDeletingProduct = useSubmission(deleteProduct);

  const reAddProductAction = useAction(reAddProduct);
  const isReAddingProduct = useSubmission(reAddProduct);

  return (
    <Suspense
      fallback={
        <div class="w-full h-full flex items-center justify-center flex-col gap-2">
          <Loader2 class="size-4 animate-spin" />
          <span class="text-sm">Loading...</span>
        </div>
      }
    >
      <Show when={product()}>
        {(productInfo) => (
          <div class="container flex flex-col gap-4 py-4">
            <div class="flex flex-row items-center justify-between gap-4">
              <div class="flex flex-row items-center gap-4">
                <Button variant="outline" size="sm" as={A} href="/products">
                  <ArrowLeft class="size-4" />
                  Back
                </Button>
              </div>
              <div class="flex flex-row items-center gap-2">
                <Button size="sm" as={A} href={`/map?products=${productInfo().id}`}>
                  <Map class="size-4" />
                  Show on Map
                </Button>
                <DropdownMenu placement="bottom-end">
                  <DropdownMenuTrigger as={Button} variant="outline" size="sm" class="bg-background">
                    <MoreHorizontal class="size-4" />
                    Settings
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem class="gap-2 cursor-pointer" as={A} href={`./edit`}>
                      <Edit class="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <Show
                      when={!productInfo().isInSortiment}
                      fallback={
                        <Dialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
                          <DialogTrigger
                            as={DropdownMenuItem}
                            class="!text-red-500 gap-2 cursor-pointer"
                            closeOnSelect={false}
                            onSelect={() => {
                              setTimeout(() => setDeleteDialogOpen(true), 10);
                            }}
                            disabled={productInfo().deletedAt !== null}
                          >
                            <X class="size-4" />
                            Remove from Sortiment
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Are you sure you want to delete this product?</DialogTitle>
                              <DialogDescription>
                                This action cannot be undone. This will permanently delete the product and all its data.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setDeleteDialogOpen(false);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  const promise = new Promise(async (resolve, reject) => {
                                    const p = await deleteProductAction(productInfo().id).catch(reject);
                                    setDeleteDialogOpen(false);
                                    return resolve(p);
                                  });
                                  toast.promise(promise, {
                                    loading: "Deleting product...",
                                    success: "Product deleted",
                                    error: "Failed to delete product",
                                  });
                                }}
                              >
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      }
                    >
                      <DropdownMenuItem
                        class="cursor-pointer"
                        onSelect={() => {
                          toast.promise(reAddProductAction(productInfo().id), {
                            loading: "Adding product back to Sortiment...",
                            success: "Product added back to Sortiment",
                            error: "Failed to add product back to Sortiment",
                          });
                        }}
                      >
                        <Show when={isReAddingProduct.pending} fallback={<Plus class="size-4" />}>
                          <Loader2 class="size-4 animate-spin" />
                        </Show>
                        Readd to Sortiment
                      </DropdownMenuItem>
                    </Show>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div class="grid grid-cols-5 w-full grow gap-4">
              <div class="col-span-3 grow flex">
                <ProductImages product={productInfo} />
              </div>
              <div class="col-span-2 w-full">
                <div class="flex flex-col w-full">
                  <div class="flex flex-col gap-2 w-full">
                    <div class="flex flex-col w-full gap-4">
                      <div class="flex flex-col w-full gap-2 pt-10">
                        <h2 class="md:text-2xl font-bold uppercase text-wrap">{productInfo().name}</h2>
                        <span class="text-sm text-muted-foreground">
                          {dayjs(productInfo().updatedAt ?? productInfo().createdAt).format("MMM DD, YYYY")}
                        </span>
                      </div>
                      <span class="text-muted-foreground">{productInfo().description}</span>
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
                  <div class="flex flex-col gap-1 border-b py-8">
                    <div class="flex flex-col gap-1 pb-10">
                      <span class="text-3xl font-bold font-['Geist_Mono_Variable']">
                        {productInfo().sellingPrice.toFixed(2)} {productInfo().currency}
                      </span>
                    </div>
                    <Show when={productInfo().suppliers}>
                      {(suppliers) => (
                        <div class="flex flex-col gap-1">
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
                              <MarginRange suppliers={suppliers()} sellingPrice={productInfo().sellingPrice} />%
                            </span>
                          </div>
                        </div>
                      )}
                    </Show>
                  </div>
                  <div class="flex flex-col gap-1 border-b py-8">
                    <Inventory product={productInfo} />
                  </div>
                  <div class="flex flex-col gap-1 pt-8">
                    <Actions product={productInfo} />
                  </div>
                </div>
              </div>
            </div>
            <Tabs defaultValue="codes" class="w-full max-w-full">
              <TabsList class="flex flex-row w-full items-center justify-start h-max">
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
        )}
      </Show>
    </Suspense>
  );
}
