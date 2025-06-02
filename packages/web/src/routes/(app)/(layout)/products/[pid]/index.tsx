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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getDevices, printProductSheet } from "@/lib/api/devices";
import { deleteProduct, downloadProductSheet, getProductById, reAddProduct } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { A, createAsync, RouteDefinition, useAction, useNavigate, useParams, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
// import Barcode from "lucide-solid/icons/barcode";
import ArrowRight from "lucide-solid/icons/arrow-right";
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

  const reAddProductAction = useAction(reAddProduct);
  const isReAddingProduct = useSubmission(reAddProduct);

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
              </div>
            </div>
            <div class="flex flex-col gap-4 w-full">
              <div class="flex flex-col gap-4 p-4 rounded-lg w-full bg-primary/5 border border-primary/10 dark:border-primary/20 dark:bg-primary/20 dark:text-primary-foreground">
                <div class="flex flex-row items-center gap-4 justify-between">
                  <div class="flex flex-row gap-2 items-center">
                    <h2 class="text-2xl font-bold tracking-wide uppercase">{productInfo().name}</h2>
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
                  <div class="flex flex-col items-end gap-2 min-w-[200px]">
                    <div class="flex flex-row items-center gap-2">
                      <DropdownMenu placement="bottom-end">
                        <DropdownMenuTrigger as={Button} variant="outline" size="icon" class="bg-background size-6">
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
                                            toast.promise(
                                              printProductSheetAction(params.whid, device.id, productInfo().id),
                                              {
                                                loading: "Printing product sheet...",
                                                success: "Product sheet printed",
                                                error: "Failed to print product sheet",
                                              },
                                            );
                                          }}
                                        >
                                          <Printer class="size-4" />
                                          {device.name.length > 0 ? device.name : device.type.name}
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
                                      This action cannot be undone. This will permanently delete the product and all its
                                      data.
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
                </div>
                <div class="flex flex-row items-center gap-4 w-full justify-between">
                  <div class="flex flex-col gap-2">
                    <div class="flex justify-between items-center gap-2">
                      <span class="text-sm font-medium">SKU:</span>
                      <span class="text-sm">{productInfo().sku}</span>
                    </div>
                    <Show when={productInfo().weight}>
                      {(w) => (
                        <div class="flex justify-between items-center gap-2">
                          <span class="text-sm font-medium">Weight:</span>
                          <span class="text-sm">
                            {w().value} {w().unit}
                          </span>
                        </div>
                      )}
                    </Show>
                    <div class="flex justify-between items-center gap-2">
                      <span class="text-sm font-medium">Last updated:</span>
                      <span class="text-sm">
                        {dayjs(productInfo().updatedAt ?? productInfo().createdAt).format("MMM DD, YYYY - h:mm A")}
                      </span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <span class="text-xl font-semibold">
                      {productInfo().sellingPrice.toFixed(2)} {productInfo().currency}
                    </span>
                    <span class="text-sm text-muted-foreground">
                      Purchase: {(productInfo().purchasePrice ?? 0).toFixed(2)} {productInfo().currency}
                    </span>
                    <span class="text-sm text-muted-foreground">
                      Margin:{" "}
                      {(
                        ((productInfo().sellingPrice - (productInfo().purchasePrice ?? 0)) /
                          productInfo().sellingPrice) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                    <span class="text-sm text-muted-foreground">
                      Stock: {productInfo().space.length}/
                      {productInfo()
                        .space.map((sp) => sp.storage.productCapacity)
                        .reduce((a, b) => a + b, 0) ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="col-span-full md:col-span-2 flex flex-col gap-4">
                <div class="flex flex-col gap-4 p-4 border rounded-lg">
                  <div class="flex flex-row items-center gap-4 justify-between">
                    <h2 class="font-medium">Images</h2>
                    <div class="flex flex-row items-center gap-2">
                      <Button variant="outline" size="sm" class="bg-background">
                        <Plus class="size-4" />
                        Add Images
                      </Button>
                    </div>
                  </div>
                  <Show
                    when={productInfo().images?.length > 0}
                    fallback={
                      <div class="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted-foreground/5">
                        <span class="text-sm text-muted-foreground">No images have been added yet</span>
                      </div>
                    }
                  >
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <For each={productInfo().images.map((pi) => pi.image)}>
                        {(image) => (
                          <div class="relative aspect-square group">
                            <img
                              src={image.url}
                              alt={image.alt ?? "Product image"}
                              class="w-full h-full object-cover rounded-lg"
                            />
                            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Button size="icon" variant="secondary">
                                <Edit class="size-4" />
                              </Button>
                              <Button size="icon" variant="destructive">
                                <X class="size-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
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
                      <div class="flex flex-col gap-4 p-4 border rounded-md">
                        <div class="flex flex-row items-center justify-between">
                          <div class="flex flex-col gap-1">
                            <span class="text-sm font-medium">{supplier.supplier.name}</span>
                            <Show when={supplier.supplier.code}>
                              <span class="text-xs text-muted-foreground">Code: {supplier.supplier.code}</span>
                            </Show>
                          </div>
                          <div class="flex items-center gap-2">
                            <span
                              class={cn("text-xs px-2 py-0.5 rounded-full", {
                                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":
                                  supplier.supplier.status === "active",
                                "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400":
                                  supplier.supplier.status === "under_review",
                                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400":
                                  supplier.supplier.status === "blacklisted",
                                "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400":
                                  supplier.supplier.status === "inactive",
                              })}
                            >
                              {supplier.supplier.status}
                            </span>
                            <Button
                              as={A}
                              href={`/suppliers/${supplier.supplier.id}`}
                              variant="outline"
                              class="bg-background"
                              size="icon"
                            >
                              <ArrowRight class="size-4" />
                            </Button>
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                          <div class="flex flex-col gap-2">
                            <span class="text-xs font-medium">Contact Information</span>
                            <div class="flex flex-col gap-1">
                              <Show when={supplier.supplier.email}>
                                <span class="text-xs text-muted-foreground">Email: {supplier.supplier.email}</span>
                              </Show>
                              <Show when={supplier.supplier.phone}>
                                <span class="text-xs text-muted-foreground">Phone: {supplier.supplier.phone}</span>
                              </Show>
                              <Show when={supplier.supplier.website}>
                                <a
                                  href={supplier.supplier.website!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="text-xs text-primary hover:underline"
                                >
                                  {supplier.supplier.website}
                                </a>
                              </Show>
                              <Show when={supplier.supplier.tax_id}>
                                <span class="text-xs text-muted-foreground">Tax ID: {supplier.supplier.tax_id}</span>
                              </Show>
                            </div>
                          </div>

                          <div class="flex flex-col gap-2">
                            <span class="text-xs font-medium">Payment Information</span>
                            <div class="flex flex-col gap-1">
                              <Show when={supplier.supplier.payment_terms}>
                                <span class="text-xs text-muted-foreground">
                                  Payment Terms: {supplier.supplier.payment_terms}
                                </span>
                              </Show>
                              <Show when={supplier.supplier.bank_details}>
                                <span class="text-xs text-muted-foreground whitespace-pre-line">
                                  Bank Details: {supplier.supplier.bank_details}
                                </span>
                              </Show>
                            </div>
                          </div>
                        </div>

                        <Show when={supplier.supplier.contacts?.length > 0}>
                          <div class="flex flex-col gap-2">
                            <span class="text-xs font-medium">Contacts</span>
                            <div class="grid grid-cols-2 gap-4">
                              <For each={supplier.supplier.contacts}>
                                {(contact) => (
                                  <div class="flex flex-col gap-1 p-2 border rounded-md">
                                    <div class="flex items-center justify-between">
                                      <span class="text-xs font-medium">{contact.name}</span>
                                      <span class="text-xs text-muted-foreground capitalize">{contact.type}</span>
                                    </div>
                                    <Show when={contact.position}>
                                      <span class="text-xs text-muted-foreground">{contact.position}</span>
                                    </Show>
                                    <Show when={contact.email || contact.phone || contact.mobile}>
                                      <div class="flex flex-col gap-0.5">
                                        <Show when={contact.email}>
                                          <span class="text-xs text-muted-foreground">{contact.email}</span>
                                        </Show>
                                        <Show when={contact.phone}>
                                          <span class="text-xs text-muted-foreground">Tel: {contact.phone}</span>
                                        </Show>
                                        <Show when={contact.mobile}>
                                          <span class="text-xs text-muted-foreground">Mob: {contact.mobile}</span>
                                        </Show>
                                      </div>
                                    </Show>
                                  </div>
                                )}
                              </For>
                            </div>
                          </div>
                        </Show>

                        <Show when={supplier.supplier.notes?.length > 0}>
                          <div class="flex flex-col gap-2">
                            <span class="text-xs font-medium">Notes</span>
                            <div class="grid grid-cols-1 gap-2">
                              <For each={supplier.supplier.notes}>
                                {(note) => (
                                  <div class="flex flex-col gap-1 p-2 border rounded-md">
                                    <div class="flex items-center justify-between">
                                      <span class="text-xs font-medium">{note.title}</span>
                                      <span class="text-xs text-muted-foreground capitalize">{note.type}</span>
                                    </div>
                                    <span class="text-xs text-muted-foreground whitespace-pre-line">
                                      {note.content}
                                    </span>
                                  </div>
                                )}
                              </For>
                            </div>
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </div>
              <div class="col-span-full md:col-span-1 flex flex-col gap-4">
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <h2 class="font-medium">Inventory</h2>
                  <div class="flex flex-col gap-1">
                    <div class="flex justify-between">
                      <span class="text-sm text-muted-foreground">Stock:</span>
                      <span class="text-sm text-muted-foreground">0</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-muted-foreground">Min Stock:</span>
                      <span class="text-sm text-muted-foreground">{productInfo().minimumStock}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-muted-foreground">Max Stock:</span>
                      <span class="text-sm text-muted-foreground">{productInfo().maximumStock ?? "N/A"}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm text-muted-foreground">Reordering At:</span>
                      <span class="text-sm text-muted-foreground">{productInfo().reorderPoint ?? "N/A"}</span>
                    </div>
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
