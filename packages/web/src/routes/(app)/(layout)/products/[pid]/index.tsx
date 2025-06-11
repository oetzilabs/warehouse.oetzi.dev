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
import {
  NumberField,
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { TextField, TextFieldInput, TextFieldLabel } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getDevices, printProductSheet } from "@/lib/api/devices";
import {
  addLabelsToProduct,
  assignBrand,
  deleteProduct,
  downloadProductSheet,
  getProductBrands,
  getProductById,
  getProductLabels,
  reAddProduct,
  removeLabelsFromProduct,
  updateProductStock,
} from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { A, createAsync, RouteDefinition, useAction, useNavigate, useParams, useSubmission } from "@solidjs/router";
import { clientOnly } from "@solidjs/start";
import type { BrandInfo } from "@warehouseoetzidev/core/src/entities/brands";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Fuse from "fuse.js";
import ArrowLeft from "lucide-solid/icons/arrow-left";
// import Barcode from "lucide-solid/icons/barcode";
import ArrowRight from "lucide-solid/icons/arrow-right";
import ArrowUpRight from "lucide-solid/icons/arrow-up-right";
import Copy from "lucide-solid/icons/copy";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import Map from "lucide-solid/icons/map";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Pencil from "lucide-solid/icons/pencil";
import Plus from "lucide-solid/icons/plus";
import Printer from "lucide-solid/icons/printer";
import RulerDimensionLine from "lucide-solid/icons/ruler-dimension-line";
import Settings from "lucide-solid/icons/settings-2";
import Weight from "lucide-solid/icons/weight";
import X from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { createStore } from "solid-js/store";
import { toast } from "solid-sonner";

dayjs.extend(relativeTime);

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
  const labels = createAsync(() => getProductLabels(), { deferStream: true });
  const brands = createAsync(() => getProductBrands(), { deferStream: true });
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const [addLabelDialogOpen, setAddLabelDialogOpen] = createSignal(false);

  const [selectedLabels, setSelectedLabels] = createSignal<string[]>([]);
  const [deleteLabelDialogOpen, setDeleteLabelDialogOpen] = createSignal<{
    isOpen: boolean;
    labelId: string | null;
    labelName: string | null;
  }>({
    isOpen: false,
    labelId: null,
    labelName: null,
  });
  const [brandDialogOpen, setBrandDialogOpen] = createSignal(false);
  const [brandSearch, setBrandSearch] = createSignal("");

  const deleteProductAction = useAction(deleteProduct);
  const isDeletingProduct = useSubmission(deleteProduct);

  const printProductSheetAction = useAction(printProductSheet);
  const isPrintingProductSheet = useSubmission(printProductSheet);

  const downloadProductSheetAction = useAction(downloadProductSheet);
  const isDownloadingProductSheet = useSubmission(downloadProductSheet);

  const addLabelsToProductAction = useAction(addLabelsToProduct);
  const isAddingLabelsToProduct = useSubmission(addLabelsToProduct);

  const removeLabelsFromProductAction = useAction(removeLabelsFromProduct);
  const isRemovingLabelsFromProduct = useSubmission(removeLabelsFromProduct);

  const assignBrandAction = useAction(assignBrand);
  const isAssigningBrand = useSubmission(assignBrand);

  const reAddProductAction = useAction(reAddProduct);
  const isReAddingProduct = useSubmission(reAddProduct);

  const filteredBrands = (brands: BrandInfo[]) => {
    if (!brandSearch()) return brands;

    const fuse = new Fuse(brands, {
      keys: ["name", "description"],
      threshold: 0.3,
    });

    return fuse.search(brandSearch()).map((result) => result.item);
  };

  const triggerDownload = (data: string, filename: string) => {
    const binaryString = atob(data);

    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
                  <div class="flex flex-col items-start gap-1">
                    <span class="text-xl font-semibold">
                      Selling Price: {productInfo().sellingPrice.toFixed(2)} {productInfo().currency}
                    </span>
                    <span class="text-sm text-muted-foreground">
                      Purchase: {(productInfo().organizations[0].purchasePrice ?? 0).toFixed(2)}{" "}
                      {productInfo().currency}
                    </span>
                    <span class="text-sm text-muted-foreground">
                      Margin:{" "}
                      {(
                        ((productInfo().sellingPrice - (productInfo().organizations[0].purchasePrice ?? 0)) /
                          productInfo().sellingPrice) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                    {/* <span class="text-sm text-muted-foreground">
                      Stock: {productInfo().space.length}/
                      {productInfo()
                        .space.map((sp) => sp.storage.capacity)
                        .reduce((a, b) => a + b, 0) ?? 0}
                    </span> */}
                  </div>
                  <div class="px-4 flex flex-row items-center gap-4">
                    <div class="flex flex-col justify-between items-center gap-1 text-muted-foreground">
                      <RulerDimensionLine class="size-6" />
                      <span class="text-sm font-medium">
                        <Show when={productInfo().dimensions} fallback="N/A">
                          {(w) => `${w().width}/${w().height}/${w().depth}/${w().unit}`}
                        </Show>
                      </span>
                    </div>
                    <div class="flex flex-col justify-between items-center gap-1 text-muted-foreground">
                      <Weight class="size-6" />
                      <span class="text-sm font-medium">
                        <Show when={productInfo().weight}>{(w) => `${w().value} ${w().unit}`}</Show>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="col-span-full md:col-span-2 flex flex-col gap-4">
                <div class="flex flex-col border rounded-lg overflow-clip">
                  <div class="flex flex-row items-center gap-4 justify-between border-b bg-muted-foreground/5 dark:bg-muted/30 p-4 ">
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
                      <div class="flex flex-col items-center justify-center p-8">
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

                <div class="flex flex-col border rounded-lg overflow-clip">
                  <div class="flex flex-row items-center gap-4 justify-between border-b bg-muted-foreground/5 dark:bg-muted/30 p-4 ">
                    <h2 class="font-medium">Codes</h2>
                    <div class="flex flex-row items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        class="bg-background"
                        onClick={() => {
                          toast.promise(navigator.clipboard.writeText(productInfo().sku ?? ""), {
                            loading: "Copying Barcode...",
                            success: `Barcode '${productInfo().sku}' copied to clipboard`,
                            error: "Failed to copy Barcode",
                          });
                        }}
                      >
                        <Copy class="size-4" />
                        Copy Barcode
                      </Button>
                    </div>
                  </div>
                  <div class="flex flex-row gap-10 items-center justify-center p-4">
                    <Barcode
                      value={productInfo().sku ?? ""}
                      fallback={
                        <span class="h-32 w-full items-center justify-center flex flex-col bg-muted-foreground/10 rounded-lg">
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
                <div class="flex flex-col border rounded-lg overflow-clip">
                  <div class="flex flex-row items-center gap-4 justify-between border-b bg-muted-foreground/5 dark:bg-muted/30 p-4 ">
                    <h2 class="font-medium">Brand</h2>
                    <div class="flex flex-row items-center gap-2">
                      <Dialog open={brandDialogOpen()} onOpenChange={setBrandDialogOpen}>
                        <DialogTrigger as={Button} variant="outline" size="sm" class="bg-background">
                          <Show
                            when={productInfo().brands}
                            fallback={
                              <>
                                <Plus class="size-4" />
                                Assign Brand
                              </>
                            }
                          >
                            <Pencil class="size-4" />
                            Change Brand
                          </Show>
                        </DialogTrigger>
                        <DialogContent class="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Select Brand</DialogTitle>
                            <DialogDescription>Search and select a brand for this product</DialogDescription>
                          </DialogHeader>
                          <div class="flex flex-col gap-4">
                            <TextField value={brandSearch()} onChange={(value) => setBrandSearch(value)}>
                              <TextFieldInput placeholder="Search brands..." />
                            </TextField>
                            <div class="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
                              <Suspense
                                fallback={
                                  <div class="flex items-center justify-center py-4">
                                    <Loader2 class="size-4 animate-spin" />
                                  </div>
                                }
                              >
                                <Show
                                  when={brands()}
                                  fallback={
                                    <div class="text-center py-4 text-sm text-muted-foreground bg-muted-foreground/5 rounded-lg">
                                      No brands available
                                    </div>
                                  }
                                >
                                  {(list) => (
                                    <For
                                      each={filteredBrands(list())}
                                      fallback={
                                        <div class="text-center py-4 text-sm text-muted-foreground bg-muted-foreground/5 rounded-lg">
                                          No brands found
                                        </div>
                                      }
                                    >
                                      {(brand) => (
                                        <div
                                          class={cn(
                                            "flex flex-col gap-1 p-4 rounded-lg border cursor-pointer hover:bg-muted-foreground/5",
                                            {
                                              "border-primary bg-primary/20": productInfo().brands?.id === brand.id,
                                              "border-input": productInfo().brands?.id !== brand.id,
                                            },
                                          )}
                                          onClick={() => {
                                            toast.promise(assignBrandAction(productInfo().id, brand.id), {
                                              loading: "Assigning brand...",
                                              success: () => {
                                                setBrandDialogOpen(false);
                                                setBrandSearch("");
                                                return "Brand assigned";
                                              },
                                              error: "Failed to assign brand",
                                            });
                                          }}
                                        >
                                          <span class="font-medium">{brand.name}</span>
                                          <Show when={brand.description}>
                                            <span class="text-sm text-muted-foreground">{brand.description}</span>
                                          </Show>
                                        </div>
                                      )}
                                    </For>
                                  )}
                                </Show>
                              </Suspense>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setBrandDialogOpen(false);
                                setBrandSearch("");
                              }}
                            >
                              Cancel
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <Show
                    when={productInfo().brands}
                    fallback={
                      <span class="flex flex-col items-center justify-center text-sm text-muted-foreground p-8">
                        No brands added.
                      </span>
                    }
                  >
                    {(b) => (
                      <div class="flex flex-col gap-1 p-4">
                        <div class="flex flex-col gap-1">
                          <span class="text-sm text-muted-foreground">{b().name ?? "N/A"}</span>
                        </div>
                      </div>
                    )}
                  </Show>
                </div>
                <div class="flex flex-col border rounded-lg overflow-clip">
                  <div class="flex flex-row items-center gap-4 justify-between border-b bg-muted-foreground/5 dark:bg-muted/30 p-4 ">
                    <h2 class="font-medium">Labels</h2>
                    <div class="flex flex-row items-center gap-2">
                      <Dialog open={addLabelDialogOpen()} onOpenChange={setAddLabelDialogOpen}>
                        <DialogTrigger as={Button} variant="outline" size="sm" class="bg-background">
                          <Plus class="size-4" />
                          Add Label{selectedLabels().length > 0 && ` (${selectedLabels().length})`}
                        </DialogTrigger>
                        <DialogContent class="sm:max-w-[800px]">
                          <DialogHeader>
                            <DialogTitle>Add Label</DialogTitle>
                            <DialogDescription>Select labels to add to this product</DialogDescription>
                          </DialogHeader>
                          <div class="flex flex-col gap-4 py-2 pb-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              <Suspense
                                fallback={
                                  <div class="flex items-center justify-center py-4">
                                    <Loader2 class="size-4 animate-spin" />
                                  </div>
                                }
                              >
                                <Show
                                  when={labels()}
                                  fallback={
                                    <div class="text-center py-4 text-sm text-muted-foreground bg-muted-foreground/5 rounded-lg">
                                      There are no labels available.
                                    </div>
                                  }
                                >
                                  {(labelsList) => {
                                    setSelectedLabels(productInfo().labels.map((l) => l.label.id));
                                    return (
                                      <For
                                        each={labelsList().sort((a, b) => {
                                          const aHasImage = a.image?.length ?? 0;
                                          const bHasImage = b.image?.length ?? 0;
                                          const aIsNewer = (a.updatedAt ?? a.createdAt) > (b.updatedAt ?? b.createdAt);
                                          return aHasImage > bHasImage
                                            ? -1
                                            : aHasImage < bHasImage
                                              ? 1
                                              : aIsNewer
                                                ? -1
                                                : 1;
                                        })}
                                      >
                                        {(label) => (
                                          <div
                                            class={cn(
                                              "bg-muted-foreground/5 rounded-lg flex flex-col gap-2 border border-neutral-200 dark:border-neutral-800 select-none cursor-pointer overflow-clip w-full h-content",
                                              {
                                                "!text-white bg-indigo-600 hover:bg-indigo-600":
                                                  selectedLabels().includes(label.id),
                                              },
                                            )}
                                            onClick={() => {
                                              setSelectedLabels((prev) => {
                                                if (prev.includes(label.id)) {
                                                  return prev.filter((id) => id !== label.id);
                                                }
                                                return [...prev, label.id];
                                              });
                                            }}
                                          >
                                            <Show
                                              when={(label.image?.length ?? 0) > 0 && label.image}
                                              fallback={<div class="bg-muted-foreground w-full h-32" />}
                                            >
                                              {(i) => <img src={i()} class="border-b w-full h-32 object-cover" />}
                                            </Show>
                                            <div class="flex flex-col gap-2 p-4 pt-2 grow">
                                              <div class="flex flex-col gap-1">
                                                <span class="text-sm font-medium leading-none">{label.name}</span>
                                                <span
                                                  class={cn("text-sm text-muted-foreground", {
                                                    "text-white/70": selectedLabels().includes(label.id),
                                                  })}
                                                >
                                                  {label.description ?? "No description available"}
                                                </span>
                                              </div>
                                              <div class="flex grow" />
                                              <div class="flex flex-col gap-1">
                                                <span
                                                  class={cn("text-xs text-muted-foreground", {
                                                    "text-white/70": selectedLabels().includes(label.id),
                                                  })}
                                                >
                                                  {dayjs(label.updatedAt ?? label.createdAt).format(
                                                    "MMM DD, YYYY - h:mm A",
                                                  )}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </For>
                                    );
                                  }}
                                </Show>
                              </Suspense>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedLabels([]);
                                setAddLabelDialogOpen(false);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              disabled={selectedLabels().length === 0 || isAddingLabelsToProduct.pending}
                              onClick={() => {
                                toast.promise(addLabelsToProductAction(productInfo().id, selectedLabels()), {
                                  loading: "Adding labels...",
                                  success: () => {
                                    setSelectedLabels([]);
                                    setAddLabelDialogOpen(false);
                                    return "Labels added";
                                  },
                                  error: "Failed to add labels",
                                });
                              }}
                            >
                              Add Selected ({selectedLabels().length})
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <For
                    each={productInfo().labels}
                    fallback={
                      <div class="flex flex-col items-center justify-center p-8">
                        <span class="text-sm text-muted-foreground">No labels added.</span>
                      </div>
                    }
                  >
                    {(label) => (
                      <div class="flex flex-row gap-2 p-4 items-center border-b last:border-b-0 justify-between">
                        <div class="flex flex-row items-center gap-2">
                          <Show when={label.label.image && label.label.image.length > 0 && label.label.image}>
                            {(src) => (
                              <img src={src()} alt={label.label.name} class="size-16 object-cover rounded-md" />
                            )}
                          </Show>
                          <div class="flex flex-col gap-1">
                            <span class="text-sm ">{label.label.name ?? "N/A"}</span>
                            <span class="text-xs text-muted-foreground">{label.label.description ?? "N/A"}</span>
                          </div>
                        </div>
                        <div class="flex items-center gap-2 h-full">
                          <Dialog
                            open={deleteLabelDialogOpen().isOpen && deleteLabelDialogOpen().labelId === label.label.id}
                            onOpenChange={(open) =>
                              setDeleteLabelDialogOpen({
                                isOpen: open,
                                labelId: open ? label.label.id : null,
                                labelName: open ? label.label.name : null,
                              })
                            }
                          >
                            <DialogTrigger as={Button} variant="outline" class="bg-background size-6" size="icon">
                              <X class="!size-3" />
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Remove Label</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to remove the label "{deleteLabelDialogOpen().labelName}" from
                                  this product?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setDeleteLabelDialogOpen({ isOpen: false, labelId: null, labelName: null });
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  disabled={isRemovingLabelsFromProduct.pending}
                                  onClick={() => {
                                    toast.promise(
                                      removeLabelsFromProductAction(productInfo().id, label.label.id).then(() => {
                                        setDeleteLabelDialogOpen({ isOpen: false, labelId: null, labelName: null });
                                      }),
                                      {
                                        loading: "Removing label...",
                                        success: "Label removed",
                                        error: "Failed to remove label",
                                      },
                                    );
                                  }}
                                >
                                  <Show when={isRemovingLabelsFromProduct.pending} fallback={<X class="size-4" />}>
                                    <Loader2 class="size-4 animate-spin" />
                                  </Show>
                                  Remove
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
                <div class="flex flex-col gap-2 border rounded-lg overflow-clip">
                  <div class="flex flex-row items-center gap-4 justify-between border-b bg-muted-foreground/5 dark:bg-muted/30 p-4 ">
                    <h2 class="font-medium">Condition</h2>
                    <div class="flex flex-row items-center gap-2">
                      <Button variant="outline" size="sm" class="bg-background">
                        <Plus class="size-4" />
                        Add Condition
                      </Button>
                    </div>
                  </div>
                  <For
                    each={productInfo().stco}
                    fallback={
                      <div class="flex flex-col items-center justify-center p-8">
                        <span class="text-sm text-muted-foreground">No conditions added.</span>
                      </div>
                    }
                  >
                    {(stco) => (
                      <div class="flex flex-col gap-1 p-4">
                        <span class="text-sm text-muted-foreground">{stco.condition?.name ?? "N/A"}</span>
                      </div>
                    )}
                  </For>
                </div>
                <div class="flex flex-col border rounded-lg overflow-clip">
                  <div class="flex flex-row items-center gap-4 justify-between border-b bg-muted-foreground/5 dark:bg-muted/30 p-4 ">
                    <h2 class="font-medium">Suppliers</h2>
                    <div class="flex flex-row items-center gap-2">
                      <Button variant="outline" size="sm" class="bg-background">
                        <Plus class="size-4" />
                        Add Supplier
                      </Button>
                    </div>
                  </div>
                  <For
                    each={productInfo().suppliers}
                    fallback={
                      <div class="flex flex-col items-center justify-center p-8">
                        <span class="text-sm text-muted-foreground">No suppliers added.</span>
                      </div>
                    }
                  >
                    {(supplier) => (
                      <div class="flex flex-col gap-4 p-4">
                        <div class="flex flex-row items-center justify-between">
                          <div class="flex flex-col gap-1">
                            <div class="flex flex-row items-center gap-2">
                              <span class="text-sm font-medium">{supplier.supplier.name}</span>
                              <span
                                class={cn("text-xs px-2 py-0.5 rounded-full select-none", {
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
                            </div>
                            <Show when={supplier.supplier.code}>
                              <span class="text-xs text-muted-foreground">Code: {supplier.supplier.code}</span>
                            </Show>
                          </div>
                          <div class="flex items-center gap-2">
                            <Button size="icon" variant="outline" class="size-6 bg-background plce-self-start">
                              <X class="!size-3" />
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
                        <div class="flex flex-row items-center justify-between gap-2">
                          <div class="">
                            <span class="text-xs text-muted-foreground">
                              <Show
                                when={supplier.supplier.updatedAt}
                                fallback={`Created ${dayjs(supplier.supplier.createdAt).fromNow()}`}
                              >
                                Updated {dayjs(supplier.supplier.updatedAt).fromNow()}
                              </Show>
                            </span>
                          </div>
                          <div class="">
                            <Button as={A} href={`/suppliers/${supplier.supplier.id}`} variant="secondary" size="sm">
                              View
                              <ArrowUpRight class="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
              <div class="col-span-full md:col-span-1 flex flex-col gap-4">
                <div class="flex flex-col border rounded-lg overflow-clip">
                  <div class="flex flex-row items-center justify-between gap-2 border-b bg-muted-foreground/5 dark:bg-muted/30 p-4">
                    <h2 class="font-medium ">Inventory</h2>
                    <StockDialog
                      id={productInfo().id}
                      minimumStock={productInfo().organizations[0].minimumStock ?? 0}
                      maximumStock={productInfo().organizations[0].maximumStock ?? 0}
                      reorderPoint={productInfo().organizations[0].reorderPoint ?? 0}
                    />
                  </div>
                  <div class="flex flex-col gap-1 p-4 border-b">
                    <div class="flex justify-between">
                      <span class="text-sm font-medium">Stock:</span>
                      <span class="text-sm">{productInfo().stock}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm font-medium">Min Stock:</span>
                      <span class="text-sm">{productInfo().organizations[0].minimumStock}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm font-medium">Max Stock:</span>
                      <span class="text-sm">{productInfo().organizations[0].maximumStock ?? "N/A"}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm font-medium">Reordering At:</span>
                      <span class="text-sm">{productInfo().organizations[0].reorderPoint ?? "N/A"}</span>
                    </div>
                  </div>
                  <div class="flex flex-col p-4">
                    <Button>Reorder Now</Button>
                  </div>
                </div>

                <div class="flex flex-col border rounded-lg">
                  <div class="flex flex-row items-center justify-between gap-2 border-b bg-muted-foreground/5 dark:bg-muted/30">
                    <h2 class="font-medium p-4">Actions</h2>
                  </div>
                  <div class="flex flex-col gap-2 p-4">
                    <DropdownMenu sameWidth>
                      <DropdownMenuTrigger as={Button} class="w-full justify-between">
                        <div class="flex items-center gap-2">
                          <Printer class="size-4" />
                          Print Product Sheet
                        </div>
                        <ArrowRight class="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <Show when={printers()}>
                          {(devices) => (
                            <For
                              each={devices()}
                              fallback={<DropdownMenuItem disabled>No printers found</DropdownMenuItem>}
                            >
                              {(device) => (
                                <DropdownMenuItem
                                  onClick={() => {
                                    toast.promise(printProductSheetAction(device.id, productInfo().id), {
                                      loading: "Printing product sheet...",
                                      success: "Product sheet printed",
                                      error: "Failed to print product sheet",
                                    });
                                  }}
                                >
                                  <Show
                                    when={
                                      isPrintingProductSheet.pending &&
                                      isPrintingProductSheet.input[0] === device.id &&
                                      isPrintingProductSheet.input[1] === productInfo().id
                                    }
                                    fallback={<Printer class="size-4" />}
                                  >
                                    <Loader2 class="size-4 animate-spin" />
                                  </Show>
                                  {device.name.length > 0 ? device.name : device.type.name}
                                </DropdownMenuItem>
                              )}
                            </For>
                          )}
                        </Show>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu sameWidth>
                      <DropdownMenuTrigger
                        as={Button}
                        variant="outline"
                        class="w-full justify-between"
                        disabled={isDownloadingProductSheet.pending}
                      >
                        <div class="flex items-center gap-2">
                          <Show when={isDownloadingProductSheet.pending} fallback={<ArrowUpRight class="size-4" />}>
                            <Loader2 class="size-4 animate-spin" />
                          </Show>
                          Download as PDF
                        </div>
                        <ArrowRight class="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <div class="flex items-center gap-2">A4</div>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                onSelect={() =>
                                  toast.promise(
                                    downloadProductSheetAction(productInfo().id, { size: "A4", type: "full" }),
                                    {
                                      loading: "Downloading product sheet...",
                                      success: (data) => {
                                        triggerDownload(data.pdf, data.name);
                                        return "Product sheet downloaded";
                                      },
                                      error: "Failed to download product sheet",
                                    },
                                  )
                                }
                              >
                                Entire Sheet
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={productInfo().stco.length === 0}
                                onSelect={() =>
                                  toast.promise(
                                    downloadProductSheetAction(productInfo().id, { size: "A4", type: "conditions" }),
                                    {
                                      loading: "Downloading conditions sheet...",
                                      success: (data) => {
                                        triggerDownload(data.pdf, data.name);
                                        return "Conditions sheet downloaded";
                                      },
                                      error: "Failed to download conditions sheet",
                                    },
                                  )
                                }
                              >
                                Conditions
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={productInfo().labels.length === 0}
                                onSelect={() =>
                                  toast.promise(
                                    downloadProductSheetAction(productInfo().id, { size: "A4", type: "labels" }),
                                    {
                                      loading: "Downloading labels sheet...",
                                      success: (data) => {
                                        triggerDownload(data.pdf, data.name);
                                        return "Labels sheet downloaded";
                                      },
                                      error: "Failed to download labels sheet",
                                    },
                                  )
                                }
                              >
                                Labels
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={productInfo().certs.length === 0}
                                onSelect={() =>
                                  toast.promise(
                                    downloadProductSheetAction(productInfo().id, {
                                      size: "A4",
                                      type: "certifications",
                                    }),
                                    {
                                      loading: "Downloading certifications sheet...",
                                      success: (data) => {
                                        triggerDownload(data.pdf, data.name);
                                        return "Certifications sheet downloaded";
                                      },
                                      error: "Failed to download certifications sheet",
                                    },
                                  )
                                }
                              >
                                Certifications
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  toast.promise(
                                    downloadProductSheetAction(productInfo().id, { size: "A4", type: "map" }),
                                    {
                                      loading: "Downloading map sheet...",
                                      success: (data) => {
                                        triggerDownload(data.pdf, data.name);
                                        return "Map sheet downloaded";
                                      },
                                      error: "Failed to download map sheet",
                                    },
                                  )
                                }
                              >
                                Map
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <div class="flex items-center gap-2">A5</div>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                onSelect={() =>
                                  toast.promise(
                                    downloadProductSheetAction(productInfo().id, { size: "A5", type: "full" }),
                                    {
                                      loading: "Downloading product sheet...",
                                      success: (data) => {
                                        triggerDownload(data.pdf, data.name);
                                        return "Product sheet downloaded";
                                      },
                                      error: "Failed to download product sheet",
                                    },
                                  )
                                }
                              >
                                Entire Sheet
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={productInfo().stco.length === 0}
                                onSelect={() =>
                                  toast.promise(
                                    downloadProductSheetAction(productInfo().id, { size: "A5", type: "conditions" }),
                                    {
                                      loading: "Downloading conditions sheet...",
                                      success: (data) => {
                                        triggerDownload(data.pdf, data.name);
                                        return "Conditions sheet downloaded";
                                      },
                                      error: "Failed to download conditions sheet",
                                    },
                                  )
                                }
                              >
                                Conditions
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={productInfo().labels.length === 0}
                                onSelect={() =>
                                  toast.promise(
                                    downloadProductSheetAction(productInfo().id, { size: "A5", type: "labels" }),
                                    {
                                      loading: "Downloading labels sheet...",
                                      success: (data) => {
                                        triggerDownload(data.pdf, data.name);
                                        return "Labels sheet downloaded";
                                      },
                                      error: "Failed to download labels sheet",
                                    },
                                  )
                                }
                              >
                                Labels
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={productInfo().certs.length === 0}
                                onSelect={() =>
                                  toast.promise(
                                    downloadProductSheetAction(productInfo().id, {
                                      size: "A5",
                                      type: "certifications",
                                    }),
                                    {
                                      loading: "Downloading certifications sheet...",
                                      success: (data) => {
                                        triggerDownload(data.pdf, data.name);
                                        return "Certifications sheet downloaded";
                                      },
                                      error: "Failed to download certifications sheet",
                                    },
                                  )
                                }
                              >
                                Certifications
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() =>
                                  toast.promise(
                                    downloadProductSheetAction(productInfo().id, { size: "A5", type: "map" }),
                                    {
                                      loading: "Downloading map sheet...",
                                      success: (data) => {
                                        triggerDownload(data.pdf, data.name);
                                        return "Map sheet downloaded";
                                      },
                                      error: "Failed to download map sheet",
                                    },
                                  )
                                }
                              >
                                Map
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

type StockDialogProps = {
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  id: string;
};

const StockDialog = (props: StockDialogProps) => {
  const [stockDialogOpen, setStockDialogOpen] = createSignal(false);
  const [stockSettings, setStockSettings] = createStore({
    minimumStock: props.minimumStock,
    maximumStock: props.maximumStock,
    reorderPoint: props.reorderPoint,
  });

  const updateProductStockAction = useAction(updateProductStock);
  const isUpdatingProductStock = useSubmission(updateProductStock);

  return (
    <Dialog open={stockDialogOpen()} onOpenChange={setStockDialogOpen}>
      <DialogTrigger as={Button} variant="outline" size="sm" class="bg-background">
        <Settings class="!size-4" />
        Change Stock
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock Settings</DialogTitle>
          <DialogDescription>Adjust stock levels and reorder points for this product</DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">Minimum Stock</span>
            <NumberField
              value={stockSettings.minimumStock}
              onRawValueChange={(value) => setStockSettings("minimumStock", value)}
            >
              <NumberFieldGroup>
                <NumberFieldInput />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
            </NumberField>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">Maximum Stock</span>
            <NumberField
              value={stockSettings.maximumStock}
              onRawValueChange={(value) => setStockSettings("maximumStock", value)}
            >
              <NumberFieldGroup>
                <NumberFieldInput />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
            </NumberField>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium">Reorder Point</span>
            <NumberField
              value={stockSettings.reorderPoint}
              onRawValueChange={(value) => setStockSettings("reorderPoint", value)}
            >
              <NumberFieldGroup>
                <NumberFieldInput />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
            </NumberField>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStockDialogOpen(false)} size="sm">
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={isUpdatingProductStock.pending}
            onClick={() => {
              // TODO: Implement update stock settings API call
              toast.promise(updateProductStockAction(props.id, stockSettings), {
                loading: "Updating stock settings...",
                success: () => {
                  setStockDialogOpen(false);
                  return "Stock settings updated";
                },
                error: "Failed to update stock settings",
              });
            }}
          >
            <Show when={isUpdatingProductStock.pending} fallback={<span>Save Changes</span>}>
              Saving Changes...
            </Show>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
