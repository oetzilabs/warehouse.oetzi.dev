import { Notes } from "@/components/features/customers/notes";
import { Orders } from "@/components/features/customers/orders";
import { PreferredDelivery } from "@/components/features/customers/preferred-delivery";
import { PreferredPickup } from "@/components/features/customers/preferred-pickup";
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
import { deleteCustomer, getCustomerById } from "@/lib/api/customers";
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
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import RotateCw from "lucide-solid/icons/rotate-cw";
import UsersRound from "lucide-solid/icons/users-round";
import X from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    getAuthenticatedUser();
    getSessionToken();
    getCustomerById(props.params.csid);
  },
} as RouteDefinition;

export default function CustomerPage() {
  const params = useParams();
  const navigate = useNavigate();
  const customer = createAsync(() => getCustomerById(params.csid), { deferStream: true });
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);

  const deleteCustomerAction = useAction(deleteCustomer);
  const isDeletingCustomer = useSubmission(deleteCustomer);

  return (
    <div class="flex flex-row w-full grow p-2 gap-2">
      <div class="flex flex-col gap-2 w-full grow">
        <div class="flex flex-row items-center justify-between gap-0 w-full bg-background">
          <div class="flex flex-row items-center gap-4">
            <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
              <UsersRound class="size-4" />
            </div>
            <h1 class="text-xl font-semibold">Customer</h1>
          </div>
          <div class="flex flex-row items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                toast.promise(revalidate(getCustomerById.keyFor(params.csid)), {
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
        <Suspense
          fallback={
            <div class="w-full h-full flex items-center justify-center flex-col gap-2">
              <Loader2 class="size-4 animate-spin" />
              <span class="text-sm">Loading...</span>
            </div>
          }
        >
          <Show when={customer()}>
            {(customerInfo) => (
              <div class="flex flex-col gap-2">
                <div class="col-span-full md:col-span-2 flex flex-col gap-2">
                  <div class="flex flex-col gap-2 p-4 rounded-lg bg-primary/5 border border-primary/10 dark:border-primary/20 dark:bg-primary/20 dark:text-primary-foreground">
                    <div class="flex flex-row items-center gap-2 justify-between">
                      <h2 class="text-2xl font-bold tracking-wide uppercase">{customerInfo().customer.name}</h2>
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
                                  <DialogTitle>Are you sure you want to delete this customer?</DialogTitle>
                                  <DialogDescription>
                                    This action cannot be undone. This will permanently delete the customer and all its
                                    data.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    disabled={isDeletingCustomer.pending}
                                    onClick={() => {
                                      const promise = new Promise(async (resolve, reject) => {
                                        const p = await deleteCustomerAction(customerInfo().customer.id).catch(reject);
                                        setDeleteDialogOpen(false);
                                        navigate("/customers");
                                        return resolve(p);
                                      });
                                      toast.promise(promise, {
                                        loading: "Deleting customer...",
                                        success: "Customer deleted",
                                        error: "Failed to delete customer",
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
                        Email: {customerInfo().customer.email ?? "N/A"}
                      </span>
                      <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                        Phone: {customerInfo().customer.phone ?? "N/A"}
                      </span>
                      <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                        Status: {customerInfo().customer.status}
                      </span>
                    </div>
                  </div>
                  <Orders customer={() => customerInfo().customer} />
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                    <PreferredPickup customer={() => customerInfo().customer} />
                    <PreferredDelivery customer={() => customerInfo().customer} />
                  </div>
                  <Notes id={() => customerInfo().customer.id} list={() => customerInfo().customer.notes} />
                </div>
              </div>
            )}
          </Show>
        </Suspense>
      </div>

      <div class="flex flex-col w-full md:w-[500px] p-4 md:overflow-auto border-b md:border-b-0 h-content"></div>
    </div>
  );
}
