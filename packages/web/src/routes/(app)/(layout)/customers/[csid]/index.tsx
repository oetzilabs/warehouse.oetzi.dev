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
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Database from "lucide-solid/icons/database";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Plus from "lucide-solid/icons/plus";
import RotateCw from "lucide-solid/icons/rotate-cw";
import ScanBarcode from "lucide-solid/icons/scan-barcode";
import Trash from "lucide-solid/icons/trash";
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
                <h1 class="text-xl font-semibold">Customer</h1>
              </div>
              <div class="flex flex-row items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    toast.promise(revalidate(getCustomerById.keyFor(customerInfo().customer.id)), {
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

            <div class="flex flex-col gap-4">
              <div class="col-span-full md:col-span-2 flex flex-col gap-4">
                <div class="flex flex-col gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10 dark:border-primary/20 dark:bg-primary/20 dark:text-primary-foreground">
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

                <div class="flex flex-col border rounded-lg">
                  <div class="flex flex-row items-center gap-2 justify-between p-4 py-2 pr-2 border-b">
                    <h2 class="font-medium">Orders</h2>
                    <div class="flex flex-row items-center">
                      <Button size="sm">
                        <Plus class="size-4" />
                        Place Order
                      </Button>
                    </div>
                  </div>
                  <div class="flex flex-col w-full">
                    <Show when={customerInfo().orders.length === 0}>
                      <div class="flex flex-col gap-4 items-center justify-center p-10 col-span-full bg-muted-foreground/5">
                        <span class="text-sm text-muted-foreground">No orders have been made</span>
                        <div class="flex flex-row gap-2 items-center justify-center">
                          <Button size="sm">
                            <Plus class="size-4" />
                            Place Order
                          </Button>
                          <Button size="sm" variant="outline" class="bg-background">
                            <Database class="size-4" />
                            Import
                          </Button>
                        </div>
                      </div>
                    </Show>
                    <Show when={customerInfo().orders.length > 0}>
                      <div class="flex flex-col gap-1 p-4">
                        <For each={customerInfo().orders}>
                          {(o) => (
                            <div class="flex flex-row gap-2 items-center justify-between">
                              {/* <span class="text-sm text-muted-foreground">{o.order.prods.length}</span> */}
                              <span class="text-sm text-muted-foreground">
                                {o.order.prods.map((p) => p.quantity).reduce((a, b) => a + b, 0)} items
                              </span>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                </div>

                <div class="flex flex-row items-center justify-between gap-4">
                  <div class="flex flex-col border rounded-lg w-full">
                    <div class="flex flex-row items-center gap-2 justify-between p-4 py-2 pr-2 border-b">
                      <h2 class="font-medium">Preferred Pickup Times</h2>
                      <div class="flex flex-row items-center">
                        <Button size="sm">
                          <Plus class="size-4" />
                          Add Time
                        </Button>
                      </div>
                    </div>
                    <div class="flex flex-col w-full">
                      <Show when={customerInfo().customer.ppt.length === 0}>
                        <div class="flex flex-col gap-4 items-center justify-center p-10 col-span-full bg-muted-foreground/5">
                          <span class="text-sm text-muted-foreground">No pickup times have been added</span>
                        </div>
                      </Show>
                      <Show when={customerInfo().customer.ppt.length > 0}>
                        <div class="flex flex-col gap-1 p-4">
                          <For each={customerInfo().customer.ppt}>
                            {(t) => (
                              <div class="flex flex-row gap-2 items-center justify-between">
                                {/* <span class="text-sm text-muted-foreground">{o.order.prods.length}</span> */}
                                <span class="text-sm text-muted-foreground">{dayjs(t.startTime).format("dddd")}</span>
                                <span class="text-sm text-muted-foreground">
                                  {dayjs(t.startTime).format("HH:mm")} - {dayjs(t.endTime).format("HH:mm")}
                                </span>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </div>

                  <div class="flex flex-col border rounded-lg w-full">
                    <div class="flex flex-row items-center gap-2 justify-between p-4 py-2 pr-2 border-b">
                      <h2 class="font-medium">Preferred Delivery Times</h2>
                      <div class="flex flex-row items-center">
                        <Button size="sm">
                          <Plus class="size-4" />
                          Add Time
                        </Button>
                      </div>
                    </div>
                    <div class="flex flex-col w-full">
                      <Show when={customerInfo().customer.pdt.length === 0}>
                        <div class="flex flex-col gap-4 items-center justify-center p-10 col-span-full bg-muted-foreground/5">
                          <span class="text-sm text-muted-foreground">No pickup times have been added</span>
                        </div>
                      </Show>
                      <Show when={customerInfo().customer.pdt.length > 0}>
                        <div class="flex flex-col gap-1 p-4">
                          <For each={customerInfo().customer.pdt}>
                            {(t) => (
                              <div class="flex flex-row gap-2 items-center justify-between">
                                {/* <span class="text-sm text-muted-foreground">{o.order.prods.length}</span> */}
                                <span class="text-sm text-muted-foreground">{dayjs(t.startTime).format("dddd")}</span>
                                <span class="text-sm text-muted-foreground">
                                  {dayjs(t.startTime).format("HH:mm")} - {dayjs(t.endTime).format("HH:mm")}
                                </span>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                    </div>
                  </div>
                </div>

                <div class="flex flex-col border rounded-lg">
                  <div class="flex flex-row items-center gap-2 justify-between p-4 py-2 pr-2 border-b">
                    <h2 class="font-medium">Notes</h2>
                    <div class="flex flex-row items-center">
                      <Button size="sm">
                        <Plus class="size-4" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                  <div class="flex flex-col w-full">
                    <Show when={customerInfo().customer.notes.length === 0}>
                      <div class="flex flex-col gap-4 items-center justify-center p-10 col-span-full bg-muted-foreground/5">
                        <span class="text-sm text-muted-foreground">No notes have been added</span>
                        <div class="flex flex-row gap-2 items-center justify-center">
                          <Button size="sm">
                            <Plus class="size-4" />
                            Add Note
                          </Button>
                        </div>
                      </div>
                    </Show>
                    <Show when={customerInfo().customer.notes.length > 0}>
                      <div class="flex flex-col gap-1">
                        <For each={customerInfo().customer.notes}>
                          {(note) => (
                            <div class="flex flex-col gap-2 p-4 border-b last:border-b-0 hover:bg-muted-foreground/5">
                              <div class="flex flex-col gap-3">
                                <div class="flex flex-row items-center gap-1 justify-between">
                                  <span class="font-semibold">{note.title}</span>
                                  <div class="flex flex-row items-center gap-2 w-max">
                                    <Button size="icon" variant="outline" class="bg-background size-6">
                                      <Edit class="size-3" />
                                    </Button>
                                    <Button size="icon" variant="outline" class="bg-background size-6">
                                      <X class="size-3" />
                                    </Button>
                                  </div>
                                </div>
                                <span class="text-sm text-muted-foreground">{note.content}</span>
                              </div>
                              <span class="text-sm text-muted-foreground">{dayjs(note.createdAt).fromNow()}</span>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
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
