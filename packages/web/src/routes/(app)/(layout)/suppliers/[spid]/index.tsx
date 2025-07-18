import { Notes } from "@/components/features/suppliers/notes";
import { Products } from "@/components/features/suppliers/products";
import { Purchases } from "@/components/features/suppliers/purchases";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { deleteSupplier, getSupplierById } from "@/lib/api/suppliers";
import {
  A,
  createAsync,
  revalidate,
  RouteDefinition,
  useAction,
  useNavigate,
  useParams,
  useSubmission,
} from "@solidjs/router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Edit from "lucide-solid/icons/edit";
import Forklift from "lucide-solid/icons/forklift";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import RotateCw from "lucide-solid/icons/rotate-cw";
import X from "lucide-solid/icons/x";
import { createSignal, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

dayjs.extend(relativeTime);

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getSessionToken();
    getSupplierById(props.params.spid);
  },
} as RouteDefinition;

export default function SupplierPage() {
  const params = useParams();
  const navigate = useNavigate();
  const supplier = createAsync(() => getSupplierById(params.spid), { deferStream: true });
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);

  const deleteSupplierAction = useAction(deleteSupplier);
  const isDeletingSupplier = useSubmission(deleteSupplier);

  return (
    <div class="flex flex-row w-full grow p-2 gap-2">
      <Suspense
        fallback={
          <div class="w-full h-full flex items-center justify-center flex-col gap-2">
            <Loader2 class="size-4 animate-spin" />
            <span class="text-sm">Loading...</span>
          </div>
        }
      >
        <Show when={supplier()}>
          {(supplierInfo) => (
            <div class="flex flex-col gap-0 w-full grow">
              <div class="flex flex-row items-center justify-between gap-0 w-full bg-background pb-2">
                <div class="flex flex-row items-center gap-4">
                  <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
                    <Forklift class="size-4" />
                  </div>
                  <h1 class="text-xl font-semibold">Supplier</h1>
                </div>
                <div class="flex flex-row items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      toast.promise(revalidate(getSupplierById.keyFor(supplierInfo().supplier.id)), {
                        loading: "Refreshing supplier...",
                        success: "Refreshed supplier",
                        error: "Failed to refresh supplier",
                      });
                    }}
                  >
                    <RotateCw class="size-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div class="flex flex-col gap-2 w-full h-content pb-4">
                <div class="flex flex-col gap-2">
                  <div class="flex flex-col gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10 dark:border-primary/20 dark:bg-primary/20 dark:text-primary-foreground">
                    <div class="flex flex-row items-center gap-2 justify-between">
                      <h2 class="text-2xl font-bold tracking-wide uppercase">{supplierInfo().supplier.name}</h2>
                      <div class="flex flex-row items-center">
                        <DropdownMenu placement="bottom-end">
                          <DropdownMenuTrigger as={Button} variant="outline" size="icon" class="bg-background size-6">
                            <MoreHorizontal class="size-3" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem class="gap-2 cursor-pointer" as={A} href="./edit">
                              <Edit class="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <Dialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
                              <DialogTrigger
                                as={DropdownMenuItem}
                                closeOnSelect={false}
                                onSelect={() => {
                                  setTimeout(() => setDeleteDialogOpen(true), 10);
                                }}
                                class="!text-red-500 gap-2 cursor-pointer"
                              >
                                <X class="size-4" />
                                Delete
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Are you sure you want to delete this supplier?</DialogTitle>
                                  <DialogDescription>
                                    This action cannot be undone. This will permanently delete the supplier and all its
                                    data.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      const promise = new Promise(async (resolve, reject) => {
                                        const p = await deleteSupplierAction(supplierInfo().supplier.id).catch(reject);
                                        setDeleteDialogOpen(false);
                                        navigate("/suppliers");
                                        return resolve(p);
                                      });
                                      toast.promise(promise, {
                                        loading: "Deleting supplier...",
                                        success: "Supplier deleted",
                                        error: "Failed to delete supplier",
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
                    <div class="flex flex-col gap-1">
                      <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                        Email: {supplierInfo().supplier.email ?? "N/A"}
                      </span>
                      <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                        Phone: {supplierInfo().supplier.phone ?? "N/A"}
                      </span>
                      <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                        Website: {supplierInfo().supplier.website ?? "N/A"}
                      </span>
                      <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                        Code: {supplierInfo().supplier.code ?? "N/A"}
                      </span>
                    </div>
                  </div>

                  <Products list={() => supplierInfo().supplier.products} />
                  <Purchases list={() => supplierInfo().supplier.purchases} />
                  <Notes id={() => supplierInfo().supplier.id} list={() => supplierInfo().supplier.notes} />
                </div>
              </div>
            </div>
          )}
        </Show>
      </Suspense>

      <div class="flex flex-col w-full md:w-[500px] p-4 md:overflow-auto border-b md:border-b-0 h-content"></div>
    </div>
  );
}
