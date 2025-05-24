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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getDevices, printProductSheet } from "@/lib/api/devices";
import { deleteProduct, downloadProductSheet, getProductById } from "@/lib/api/products";
import { A, createAsync, RouteDefinition, useAction, useNavigate, useParams, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Copy from "lucide-solid/icons/copy";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import Map from "lucide-solid/icons/map";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Plus from "lucide-solid/icons/plus";
import Printer from "lucide-solid/icons/printer";
import X from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

const Barcode = clientOnly(() => import("@/components/barcode"));
const QRCode = clientOnly(() => import("@/components/qrcode"));

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
  const printers = createAsync(() => getDevices(), { deferStream: true });
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);

  const deleteProductAction = useAction(deleteProduct);
  const isDeletingProduct = useSubmission(deleteProduct);

  const printProductSheetAction = useAction(printProductSheet);
  const isPrintingProductSheet = useSubmission(printProductSheet);

  const downloadProductSheetAction = useAction(downloadProductSheet);
  const isDownloadingProductSheet = useSubmission(downloadProductSheet);

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(-1);
                  }}
                >
                  <ArrowLeft class="size-4" />
                  Back
                </Button>
                <div class="flex flex-row items-baseline gap-2">
                  <h1 class="text-xl font-semibold">{productInfo().name}</h1>
                  <Show when={productInfo().deletedAt}>
                    <span class="text-xs font-semibold text-red-500">Deleted</span>
                  </Show>
                </div>
              </div>
              <div class="flex flex-row items-center gap-2">
                <Button size="sm" as={A} href={`/map?products=${productInfo().id}`}>
                  <Map class="size-4" />
                  Show on Map
                </Button>
                <DropdownMenu placement="bottom-end">
                  <DropdownMenuTrigger as={Button} variant="outline" size="icon">
                    <MoreHorizontal class="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem class="gap-2 cursor-pointer" as={A} href={`./edit`}>
                      <Edit class="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSub overlap>
                      <DropdownMenuSubTrigger class="gap-2 cursor-pointer">
                        <Printer class="size-4" />
                        Print Sheet
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <Show when={printers()}>
                            {(devices) => (
                              <For
                                each={devices()}
                                fallback={<DropdownMenuItem disabled>No printers found</DropdownMenuItem>}
                              >
                                {(device) => (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      toast.promise(printProductSheetAction(params.whid, device.id, productInfo().id), {
                                        loading: "Printing product sheet...",
                                        success: "Product sheet printed",
                                        error: "Failed to print product sheet",
                                      });
                                    }}
                                  >
                                    <Printer class="size-4" />
                                    {device.name.length > 0 ? device.name : device.type}
                                  </DropdownMenuItem>
                                )}
                              </For>
                            )}
                          </Show>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              toast.promise(downloadProductSheetAction(productInfo().id), {
                                loading: "Downloading product sheet...",
                                success: "Product sheet downloaded",
                                error: "Failed to download product sheet",
                              });
                            }}
                            disabled
                          >
                            Download as PDF
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <Dialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger
                        as={DropdownMenuItem}
                        class="!text-red-500 gap-2 cursor-pointer"
                        closeOnSelect={false}
                        onSelect={() => {
                          setTimeout(() => setDeleteDialogOpen(true), 10);
                        }}
                      >
                        <X class="size-4" />
                        Delete
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="col-span-full md:col-span-2 flex flex-col gap-4">
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <div class="flex flex-row items-center gap-2 justify-between">
                    <h2 class="font-medium">Details</h2>
                    <div class="flex flex-row items-center">
                      <Button variant="ghost" size="icon">
                        <Edit class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-sm text-muted-foreground">SKU: {productInfo().sku}</span>
                    <Show when={productInfo().weight}>
                      {(w) => (
                        <span class="text-sm text-muted-foreground">
                          Weight: {w().value} {w().unit}
                        </span>
                      )}
                    </Show>
                    <span class="text-sm text-muted-foreground">
                      Last updated:{" "}
                      {dayjs(productInfo().updatedAt ?? productInfo().createdAt).format("MMM DD, YYYY - h:mm A")}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <div class="flex flex-row items-center gap-2 justify-between">
                    <h2 class="font-medium">Codes</h2>
                    <div class="flex flex-row items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          toast.promise(navigator.clipboard.writeText(productInfo().sku ?? ""), {
                            loading: "Copying Barcode...",
                            success: `Barcode '${productInfo().barcode}' copied to clipboard`,
                            error: "Failed to copy Barcode",
                          });
                        }}
                      >
                        <Copy class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div class="flex flex-row gap-10 items-center justify-center">
                    <Barcode
                      value={productInfo().sku ?? ""}
                      fallback={
                        <span class="h-32 w-[250px] items-center justify-center flex flex-col bg-muted-foreground/10 rounded-lg">
                          <Loader2 class="size-4 animate-spin" />
                        </span>
                      }
                    />
                    <QRCode
                      value={productInfo().sku ?? ""}
                      fallback={
                        <span class="size-40 items-center justify-center flex flex-col bg-muted-foreground/10 rounded-lg">
                          <Loader2 class="size-4 animate-spin" />
                        </span>
                      }
                    />
                  </div>
                </div>
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <div class="flex flex-row items-center gap-2 justify-between">
                    <h2 class="font-medium">Brand</h2>
                    <div class="flex flex-row items-center">
                      <Button variant="ghost" size="icon">
                        <Plus class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <Show
                    when={productInfo().brands}
                    fallback={<span class="text-sm text-muted-foreground">No brands added.</span>}
                  >
                    {(b) => (
                      <div class="flex flex-col gap-1">
                        <span class="text-sm text-muted-foreground">{b().name ?? "N/A"}</span>
                      </div>
                    )}
                  </Show>
                </div>
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <div class="flex flex-row items-center gap-2 justify-between">
                    <h2 class="font-medium">Condition</h2>
                    <div class="flex flex-row items-center">
                      <Button variant="ghost" size="icon">
                        <Plus class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <For
                    each={productInfo().stco}
                    fallback={
                      <div class="flex flex-col gap-1">
                        <span class="text-sm text-muted-foreground">No conditions added.</span>
                      </div>
                    }
                  >
                    {(stco) => (
                      <div class="flex flex-col gap-1">
                        <span class="text-sm text-muted-foreground">{stco.condition?.name ?? "N/A"}</span>
                      </div>
                    )}
                  </For>
                </div>
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <div class="flex flex-row items-center gap-2 justify-between">
                    <h2 class="font-medium">Suppliers</h2>
                    <div class="flex flex-row items-center">
                      <Button variant="ghost" size="icon">
                        <Plus class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <For
                    each={productInfo().suppliers}
                    fallback={
                      <div class="flex flex-col gap-1">
                        <span class="text-sm text-muted-foreground">No suppliers added.</span>
                      </div>
                    }
                  >
                    {(supplier) => (
                      <div class="flex flex-col gap-1">
                        <span class="text-sm text-muted-foreground">{supplier.supplier.name ?? "N/A"}</span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
              <div class="col-span-full md:col-span-1 flex flex-col gap-4">
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <h2 class="font-medium">Pricing</h2>
                  <div class="flex flex-col gap-1">
                    <span class="text-sm text-muted-foreground">
                      Selling Price: {productInfo().sellingPrice.toFixed(2)} {productInfo().currency}
                    </span>
                    <span class="text-sm text-muted-foreground">
                      Purchase Price: {(productInfo().purchasePrice ?? 0).toFixed(2)} {productInfo().currency}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <h2 class="font-medium">Inventory</h2>
                  <div class="flex flex-col gap-1">
                    <span class="text-sm text-muted-foreground">Stock: 0</span>
                    <span class="text-sm text-muted-foreground">Min Stock: {productInfo().minimumStock}</span>
                    <span class="text-sm text-muted-foreground">Max Stock: {productInfo().maximumStock ?? "N/A"}</span>
                    <span class="text-sm text-muted-foreground">
                      Reordering At: {productInfo().reorderPoint ?? "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>
    </Suspense>
  );
}
