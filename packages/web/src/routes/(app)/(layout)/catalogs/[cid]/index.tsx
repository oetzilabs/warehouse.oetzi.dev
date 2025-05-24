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
import { deleteCatalog, downloadSheet, getCatalogById, printSheet } from "@/lib/api/catalogs";
import { getDevices } from "@/lib/api/devices";
import { A, createAsync, RouteDefinition, useAction, useNavigate, useParams, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Printer from "lucide-solid/icons/printer";
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
  const printers = createAsync(() => getDevices(), { deferStream: true });

  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);

  const printCatalogSheetAction = useAction(printSheet);
  const isPrintingCatalogSheet = useSubmission(printSheet);

  const downloadCatalogSheetAction = useAction(downloadSheet);
  const isDownloadingCatalogSheet = useSubmission(downloadSheet);

  const deleteCatalogAction = useAction(deleteCatalog);
  const isDeletingCatalog = useSubmission(deleteCatalog);

  return (
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
                  <h1 class="text-xl font-semibold">{catalogInfo().name}</h1>
                  <Show when={catalogInfo().deletedAt}>
                    <span class="text-sm font-semibold text-red-500">Deleted</span>
                  </Show>
                </div>
              </div>
              <div class="flex flex-row items-center gap-2">
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
                                    disabled={
                                      isPrintingCatalogSheet.pending && isPrintingCatalogSheet.input[1] === device.id
                                    }
                                    onClick={() => {
                                      toast.promise(printCatalogSheetAction(params.whid, device.id, catalogInfo().id), {
                                        loading: "Printing catalog sheet...",
                                        success: "Catalog sheet printed",
                                        error: "Failed to print catalog sheet",
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
                    <span class="text-sm text-muted-foreground">Description: {catalogInfo().description ?? "N/A"}</span>
                    <span class="text-sm text-muted-foreground">
                      Last updated:{" "}
                      {dayjs(catalogInfo().updatedAt ?? catalogInfo().createdAt).format("MMM DD, YYYY - h:mm A")}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <div class="flex flex-row items-center gap-2 justify-between">
                    <h2 class="font-medium">Products</h2>
                    <div class="flex flex-row items-center">
                      <Button variant="ghost" size="icon">
                        <Edit class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <For
                      each={catalogInfo().products}
                      fallback={
                        <div class="col-span-full flex flex-col gap-1 items-center justify-center p-8 border rounded-lg">
                          <span class="text-sm text-muted-foreground">No products in this catalog</span>
                        </div>
                      }
                    >
                      {(product) => (
                        <div class="flex flex-col gap-2 p-4 border rounded-lg">
                          <span class="text-sm font-medium">{product.product.name}</span>
                          <span class="text-sm text-muted-foreground">SKU: {product.product.sku}</span>
                          <span class="text-sm text-muted-foreground">
                            Price: {product.product.sellingPrice} {product.product.currency}
                          </span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>
              <div class="col-span-full md:col-span-1 flex flex-col gap-4">
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <h2 class="font-medium">Status</h2>
                  <div class="flex flex-col gap-1">
                    <span class="text-sm text-muted-foreground">Active: {catalogInfo().isActive ? "Yes" : "No"}</span>
                    <span class="text-sm text-muted-foreground">
                      Start Date: {dayjs(catalogInfo().startDate).format("MMM DD, YYYY")}
                    </span>
                    <span class="text-sm text-muted-foreground">
                      End Date: {dayjs(catalogInfo().endDate).format("MMM DD, YYYY")}
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
