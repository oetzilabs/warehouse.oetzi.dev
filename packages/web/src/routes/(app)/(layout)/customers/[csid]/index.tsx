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
import { A, createAsync, RouteDefinition, useAction, useNavigate, useParams, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import X from "lucide-solid/icons/x";
import { createSignal, Show, Suspense } from "solid-js";
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
          <div class="container flex flex-col gap-4 py-4">
            <div class="flex flex-row items-center justify-between gap-4">
              <div class="flex flex-row items-center gap-4">
                <Button variant="outline" size="sm" as={A} href="/customers">
                  <ArrowLeft class="size-4" />
                  Back
                </Button>
                <h1 class="text-xl font-semibold">{customerInfo().name}</h1>
              </div>
              <div class="flex flex-row items-center gap-2">
                <DropdownMenu placement="bottom-end">
                  <DropdownMenuTrigger as={Button} variant="outline" size="icon">
                    <MoreHorizontal class="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem class="gap-2 cursor-pointer" as={A} href="./edit">
                      <Edit class="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <Dialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger as={DropdownMenuItem} class="!text-red-500 gap-2 cursor-pointer">
                        <X class="size-4" />
                        Delete
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you sure you want to delete this customer?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete the customer and all its data.
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
                                const p = await deleteCustomerAction(customerInfo().id).catch(reject);
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

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="col-span-full md:col-span-2 flex flex-col gap-4">
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <h2 class="font-medium">Contact Information</h2>
                  <div class="flex flex-col gap-1">
                    <span class="text-sm text-muted-foreground">Email: {customerInfo().email ?? "N/A"}</span>
                    <span class="text-sm text-muted-foreground">Phone: {customerInfo().phone ?? "N/A"}</span>
                  </div>
                </div>
              </div>

              <div class="col-span-full md:col-span-1 flex flex-col gap-4">
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <h2 class="font-medium">Status</h2>
                  <div class="flex flex-col gap-1">
                    <span class="text-sm text-muted-foreground">Status: {customerInfo().status}</span>
                    <span class="text-sm text-muted-foreground">
                      Created: {dayjs(customerInfo().createdAt).format("MMM DD, YYYY")}
                    </span>
                    <span class="text-sm text-muted-foreground">
                      Last Updated: {dayjs(customerInfo().updatedAt).format("MMM DD, YYYY")}
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
