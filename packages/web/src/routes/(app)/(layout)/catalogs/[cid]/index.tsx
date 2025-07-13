import { ProductsList } from "@/components/lists/catalogs/products";
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
import { TextField, TextFieldInput } from "@/components/ui/text-field";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { addProductsToCatalog, deleteCatalog, downloadSheet, getCatalogById, printSheet } from "@/lib/api/catalogs";
import { getDevices } from "@/lib/api/devices";
import { getProducts } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { A, createAsync, RouteDefinition, useAction, useNavigate, useParams, useSubmission } from "@solidjs/router";
import { ProductInfo } from "@warehouseoetzidev/core/src/entities/products";
import dayjs from "dayjs";
import Fuse from "fuse.js";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import BookOpenText from "lucide-solid/icons/book-open-text";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Package from "lucide-solid/icons/package";
import Plus from "lucide-solid/icons/plus";
import Printer from "lucide-solid/icons/printer";
import Settings from "lucide-solid/icons/settings-2";
import X from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getSessionToken();
    getCatalogById(props.params.cid);
    getDevices();
  },
} as RouteDefinition;

export default function CatalogPage() {
  const params = useParams();
  const navigate = useNavigate();
  const catalog = createAsync(() => getCatalogById(params.cid), { deferStream: true });
  const products = createAsync(() => getProducts(), { deferStream: true });
  const printers = createAsync(() => getDevices(), { deferStream: true });

  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = createSignal(false);
  const [productSearch, setProductSearch] = createSignal("");
  const [selectedProducts, setSelectedProducts] = createSignal<string[]>([]);

  const printCatalogSheetAction = useAction(printSheet);
  const isPrintingCatalogSheet = useSubmission(printSheet);

  const downloadCatalogSheetAction = useAction(downloadSheet);
  const isDownloadingCatalogSheet = useSubmission(downloadSheet);

  const deleteCatalogAction = useAction(deleteCatalog);
  const isDeletingCatalog = useSubmission(deleteCatalog);

  const addProductsToCatalogAction = useAction(addProductsToCatalog);
  const isAddingProductsToCatalog = useSubmission(addProductsToCatalog);

  const filteredProducts = (products: ProductInfo[]) => {
    if (!productSearch()) return products;

    const fuse = new Fuse(products, {
      keys: ["name", "sku", "description"],
      threshold: 0.3,
    });

    return fuse.search(productSearch()).map((result) => result.item);
  };

  return (
    <div class="flex flex-row w-full grow p-2 gap-2">
      <div class="flex flex-col gap-2 w-full grow">
        <div class="flex flex-row items-center gap-4">
          <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
            <BookOpenText class="size-4" />
          </div>
          <span class="font-medium">Catalog</span>
        </div>
        <Suspense
          fallback={
            <div class="w-full h-full flex items-center justify-center flex-col gap-2">
              <Loader2 class="size-4 animate-spin" />
              <span class="text-sm">Loading...</span>
            </div>
          }
        >
          <Show when={catalog()}>
            {(catalogInfo) => (
              <>
                <div class="flex flex-col gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 dark:border-primary/20 dark:bg-primary/20 dark:text-primary-foreground">
                  <div class="flex flex-row items-center gap-2 justify-between">
                    <div class="flex flex-row items-baseline gap-2">
                      <h2 class="text-2xl font-bold tracking-wide uppercase">{catalogInfo().name}</h2>
                      <Show when={catalogInfo().deletedAt}>
                        <span class="text-sm font-semibold text-red-500">Deleted</span>
                      </Show>
                    </div>
                    <DropdownMenu placement="bottom-end">
                      <DropdownMenuTrigger as={Button} variant="outline" size="icon" class="bg-background size-6">
                        <MoreHorizontal class="size-3" />
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
                                        disabled={
                                          isPrintingCatalogSheet.pending &&
                                          isPrintingCatalogSheet.input[1] === device.id
                                        }
                                        onClick={() => {
                                          toast.promise(
                                            printCatalogSheetAction(params.whid, device.id, catalogInfo().id),
                                            {
                                              loading: "Printing catalog sheet...",
                                              success: "Catalog sheet printed",
                                              error: "Failed to print catalog sheet",
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
                                  toast.promise(downloadCatalogSheetAction(catalogInfo().id), {
                                    loading: "Downloading catalog sheet...",
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
                              <DialogTitle>Are you sure you want to delete this catalog?</DialogTitle>
                              <DialogDescription>
                                This action cannot be undone. This will permanently delete the catalog and all its data.
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
                                    const p = await deleteCatalogAction(catalogInfo().id).catch(reject);
                                    setDeleteDialogOpen(false);
                                    navigate("/catalogs");
                                    return resolve(p);
                                  });
                                  toast.promise(promise, {
                                    loading: "Deleting catalog...",
                                    success: "Catalog deleted",
                                    error: "Failed to delete catalog",
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
                  <div class="flex flex-col gap-1">
                    <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                      Description: {catalogInfo().description ?? "N/A"}
                    </span>
                    <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                      Status: {catalogInfo().isActive ? "Active" : "Inactive"}
                    </span>
                    <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                      Date Range: {dayjs(catalogInfo().startDate).format("MMM DD, YYYY")} -{" "}
                      {dayjs(catalogInfo().endDate).format("MMM DD, YYYY")}
                    </span>
                    <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                      Last Updated:{" "}
                      {dayjs(catalogInfo().updatedAt ?? catalogInfo().createdAt).format("MMM DD, YYYY - h:mm A")}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col">
                  <div class="flex flex-row items-center gap-2 justify-between py-2 ">
                    <div class="flex flex-row items-center gap-2">
                      <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                        <Package class="size-4" />
                      </div>
                      <h2 class="font-medium">Products</h2>
                    </div>
                    <Dialog open={addProductDialogOpen()} onOpenChange={setAddProductDialogOpen}>
                      <DialogTrigger as={Button} size="sm">
                        <Show
                          when={catalogInfo().products.length > 0}
                          fallback={
                            <>
                              Add Product{selectedProducts().length > 0 && ` (${selectedProducts().length})`}
                              <Plus class="size-4" />
                            </>
                          }
                        >
                          <>
                            Change Products
                            <Package class="size-4" />
                          </>
                        </Show>
                      </DialogTrigger>
                      <DialogContent class="sm:max-w-[800px]">
                        <DialogHeader>
                          <DialogTitle>Add Products</DialogTitle>
                          <DialogDescription>Select products to add to this catalog</DialogDescription>
                        </DialogHeader>
                        <div class="flex flex-col gap-4">
                          <TextField value={productSearch()} onChange={(value) => setProductSearch(value)}>
                            <TextFieldInput placeholder="Search products..." />
                          </TextField>
                          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                            <Suspense
                              fallback={
                                <div class="flex items-center justify-center py-4">
                                  <Loader2 class="size-4 animate-spin" />
                                </div>
                              }
                            >
                              <Show
                                when={products()}
                                fallback={
                                  <div class="text-center py-4 text-sm text-muted-foreground bg-muted-foreground/5 rounded-lg">
                                    No products available
                                  </div>
                                }
                              >
                                {(productList) => {
                                  setSelectedProducts(catalogInfo().products.map((p) => p.product.id));
                                  return (
                                    <For
                                      each={filteredProducts(
                                        // @ts-ignore - TODO: fix this
                                        productList().map((p) => p.product),
                                      )}
                                      fallback={
                                        <div class="text-center py-4 text-sm text-muted-foreground bg-muted-foreground/5 rounded-lg">
                                          No products found
                                        </div>
                                      }
                                    >
                                      {(product) => (
                                        <div
                                          class={cn(
                                            "flex flex-col gap-2 p-4 rounded-lg border cursor-pointer hover:bg-muted-foreground/5",
                                            {
                                              "border-primary bg-primary/20 hover:bg-primary/30":
                                                selectedProducts().includes(product.id),
                                              "border-input": !selectedProducts().includes(product.id),
                                            },
                                          )}
                                          onClick={() => {
                                            setSelectedProducts((prev) => {
                                              if (prev.includes(product.id)) {
                                                return prev.filter((id) => id !== product.id);
                                              }
                                              return [...prev, product.id];
                                            });
                                          }}
                                        >
                                          <span class="font-medium">{product.name}</span>
                                          <span class="text-sm text-muted-foreground">SKU: {product.sku}</span>
                                          <span class="text-sm text-muted-foreground">
                                            Price: {product.sellingPrice} {product.currency}
                                          </span>
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
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAddProductDialogOpen(false);
                              setSelectedProducts([]);
                              setProductSearch("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            disabled={isAddingProductsToCatalog.pending}
                            onClick={() => {
                              toast.promise(addProductsToCatalogAction(catalogInfo().id, selectedProducts()), {
                                loading: "Adding products...",
                                success: () => {
                                  setAddProductDialogOpen(false);
                                  setSelectedProducts([]);
                                  setProductSearch("");
                                  return "Products added";
                                },
                                error: "Failed to add products",
                              });
                            }}
                          >
                            <Show when={isAddingProductsToCatalog.pending} fallback={<>Save</>}>
                              <Loader2 class="size-4 animate-spin" />
                            </Show>
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <ProductsList
                    data={() =>
                      catalogInfo().products.map((p) => ({
                        productId: p.product.id,
                        product: p.product,
                        catalogId: p.catalogId,
                        discount: p.discount,
                      }))
                    }
                  />
                </div>
              </>
            )}
          </Show>
        </Suspense>
      </div>
      <div class="hidden md:flex w-px h-full bg-border"></div>
      <div class="w-0 md:w-[500px] h-full"></div>
    </div>
  );
}
