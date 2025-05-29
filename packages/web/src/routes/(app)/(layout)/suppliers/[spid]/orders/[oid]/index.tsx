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
import { getAuthenticatedUser, getSessionToken } from "@/lib/api/auth";
import { getDevices } from "@/lib/api/devices";
import { deleteOrder, getOrderById } from "@/lib/api/orders";
import { cn } from "@/lib/utils";
import { A, createAsync, RouteDefinition, useAction, useNavigate, useParams, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Plus from "lucide-solid/icons/plus";
import Printer from "lucide-solid/icons/printer";
import Receipt from "lucide-solid/icons/receipt";
import Send from "lucide-solid/icons/send";
import X from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: (props) => {
    const user = getAuthenticatedUser();
    const sessionToken = getSessionToken();
    const order = getOrderById(props.params.oid);
    return { user, sessionToken, order };
  },
} as RouteDefinition;

export default function SupplierOrderPage() {
  const params = useParams();
  const navigate = useNavigate();
  const order = createAsync(() => getOrderById(params.oid), { deferStream: true });
  const devices = createAsync(() => getDevices(), { deferStream: true });
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);

  const deleteOrderAction = useAction(deleteOrder);
  const isDeletingOrder = useSubmission(deleteOrder);

  return (
    <Suspense
      fallback={
        <div class="w-full h-full flex items-center justify-center flex-col gap-2">
          <Loader2 class="size-4 animate-spin" />
          <span class="text-sm">Loading...</span>
        </div>
      }
    >
      <Show when={order()}>
        {(orderInfo) => (
          <div class="container flex flex-col gap-4 py-4">
            <div class="flex flex-row items-center justify-between gap-4">
              <div class="flex flex-row items-center gap-4">
                <Button variant="outline" size="sm" as={A} href={`/suppliers/${params.spid}`}>
                  <ArrowLeft class="size-4" />
                  Back
                </Button>
                <div class="flex flex-row items-baseline gap-2">
                  <h1 class="text-xl font-semibold">#{orderInfo().barcode ?? "N/A"}</h1>
                  <span
                    class={cn("text-xs font-semibold", {
                      "text-yellow-500": orderInfo().status.toLowerCase() === "pending",
                      "text-green-500": orderInfo().status.toLowerCase() === "completed",
                      "text-red-500": orderInfo().status.toLowerCase() === "cancelled",
                      "text-blue-500": orderInfo().status.toLowerCase() === "processing",
                      "text-muted-foreground": !["pending", "completed", "cancelled", "processing"].includes(
                        orderInfo().status.toLowerCase(),
                      ),
                    })}
                  >
                    {orderInfo().status}
                  </span>
                </div>
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
                          <DialogTitle>Are you sure you want to delete this order?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete the order and all its data.
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
                                const p = await deleteOrderAction(orderInfo().id).catch(reject);
                                setDeleteDialogOpen(false);
                                navigate(`/suppliers/${params.spid}`);
                                return resolve(p);
                              });
                              toast.promise(promise, {
                                loading: "Deleting order...",
                                success: "Order deleted",
                                error: "Failed to delete order",
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
                  <h2 class="font-medium">Order Details</h2>
                  <div class="flex flex-col gap-1">
                    <span class="text-sm text-muted-foreground">
                      Created: {dayjs(orderInfo().createdAt).format("MMM DD, YYYY - h:mm A")}
                    </span>
                    <span class="text-sm text-muted-foreground">
                      Updated: {dayjs(orderInfo().updatedAt).format("MMM DD, YYYY - h:mm A")}
                    </span>
                    <span class="text-sm text-muted-foreground">
                      Total Items:{" "}
                      {orderInfo()
                        .prods.map((p) => p.quantity)
                        .reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                </div>

                <div class="flex flex-col border rounded-lg">
                  <div class="w-full p-4 border-b">
                    <h2 class="font-medium">Products</h2>
                  </div>
                  <div class="flex flex-col gap-0">
                    <For each={orderInfo().prods}>
                      {(product) => (
                        <div class="flex flex-row items-center justify-between p-4 hover:bg-muted-foreground/5 rounded-md border-b last:border-b-0">
                          <div class="flex flex-col gap-0.5">
                            <span class="font-medium">{product.product.name}</span>
                            <span class="text-sm text-muted-foreground">SKU: {product.product.sku}</span>
                            <Show when={product.product.tg}>
                              <span class="text-sm text-muted-foreground">
                                {product.product.tg?.name} ({product.product.tg?.crs[0]?.tr.rate}%)
                              </span>
                            </Show>
                          </div>
                          <div class="flex flex-col items-end">
                            <div class="flex flex-row items-baseline gap-1">
                              <span class="text-sm text-muted-foreground">
                                {product.product.sellingPrice.toFixed(2)}
                              </span>
                              <span class="font-medium">x{product.quantity}</span>
                            </div>
                            <span class="text-sm text-muted-foreground">
                              {(product.product.sellingPrice * product.quantity).toFixed(2)} {product.product.currency}
                            </span>
                            <Show when={product.product.tg}>
                              <span class="text-xs text-muted-foreground">
                                +
                                {(
                                  (product.product.sellingPrice *
                                    product.quantity *
                                    (product.product.tg!.crs[0]?.tr.rate ?? 0)) /
                                  100
                                ).toFixed(2)}{" "}
                                {product.product.currency} Tax
                              </span>
                            </Show>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>

              <div class="col-span-full md:col-span-1 flex flex-col gap-4">
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <h2 class="font-medium">Summary</h2>
                  <div class="flex flex-col">
                    <For
                      each={Object.entries(
                        orderInfo()
                          .prods.filter((prod) => prod.product.currency !== null)
                          .reduce(
                            (acc, prod) => {
                              const currency = prod.product.currency!;
                              if (!acc[currency]) {
                                acc[currency] = {
                                  subtotal: 0,
                                  taxGroups: new Map(),
                                  total: 0,
                                };
                              }

                              const amount = prod.product.sellingPrice * prod.quantity;
                              acc[currency].subtotal += amount;
                              acc[currency].total += amount;

                              if (prod.product.tg) {
                                const tgKey = prod.product.tg.name;
                                if (!acc[currency].taxGroups.has(tgKey)) {
                                  acc[currency].taxGroups.set(tgKey, {
                                    name: prod.product.tg.name,
                                    rates: new Map(),
                                    total: 0,
                                  });
                                }

                                for (const cr of prod.product.tg.crs) {
                                  const rate = cr.tr.rate;
                                  const taxAmount = amount * (rate / 100);
                                  const tg = acc[currency].taxGroups.get(tgKey)!;

                                  if (!tg.rates.has(rate)) {
                                    tg.rates.set(rate, { amount: 0, rate });
                                  }
                                  tg.rates.get(rate)!.amount += taxAmount;
                                  tg.total += taxAmount;
                                  acc[currency].total += taxAmount; // Add tax only once to total
                                }
                              }

                              return acc;
                            },
                            {} as Record<
                              string,
                              {
                                subtotal: number;
                                taxGroups: Map<
                                  string,
                                  {
                                    name: string;
                                    rates: Map<number, { rate: number; amount: number }>;
                                    total: number;
                                  }
                                >;
                                total: number;
                              }
                            >,
                          ),
                      )}
                    >
                      {([currency, amounts]) => (
                        <div class="flex flex-col gap-1">
                          <div class="flex justify-between">
                            <span class="text-sm font-medium">{currency}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-sm text-muted-foreground">Subtotal</span>
                            <span class="text-sm font-medium">
                              {amounts.subtotal.toFixed(2)} {currency}
                            </span>
                          </div>

                          <For each={Array.from(amounts.taxGroups.entries())}>
                            {([_, taxGroup]) => (
                              <For each={Array.from(taxGroup.rates.entries())}>
                                {([_, rateInfo]) => (
                                  <div class="flex justify-between pl-4">
                                    <span class="text-sm text-muted-foreground">
                                      {taxGroup.name} ({rateInfo.rate}%)
                                    </span>
                                    <span class="text-sm font-medium">
                                      {rateInfo.amount.toFixed(2)} {currency}
                                    </span>
                                  </div>
                                )}
                              </For>
                            )}
                          </For>

                          <div class="flex justify-between border-t border-dashed mt-2 pt-2">
                            <span class="font-medium">Total</span>
                            <span class="font-medium">
                              {amounts.total.toFixed(2)} {currency}
                            </span>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
                <div class="flex flex-col gap-2 p-4 border rounded-lg">
                  <h2 class="font-medium">Actions</h2>
                  <div class="flex flex-row gap-2 w-full">
                    <Button size="lg" variant="outline" class="bg-background w-full">
                      <Receipt class="size-6" />
                      Download Invoice
                    </Button>
                    <Button size="lg" variant="outline" class="bg-background w-full">
                      <Send class="size-6" />
                      Send Order
                    </Button>
                  </div>
                  <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Suspense
                      fallback={
                        <div class="w-full bg-muted-foreground/5 rounded-md p-2 flex items-center justify-center col-span-full">
                          <Loader2 class="size-4 animate-spin" />
                        </div>
                      }
                    >
                      <Show when={devices()}>
                        {(printers) => (
                          <For
                            each={printers()}
                            fallback={
                              <div class="w-full bg-muted-foreground/5 rounded-md p-4 gap-2 flex flex-col items-center justify-center border col-span-full">
                                <span class="text-sm text-muted-foreground">No printers found</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  class="bg-background"
                                  as={A}
                                  href="/devices/add?type=printer"
                                >
                                  <Plus class="size-4" />
                                  Add Printer
                                </Button>
                              </div>
                            }
                          >
                            {(printer) => (
                              <Button
                                onClick={() => {
                                  console.log("Selected printer:", printer);
                                }}
                                size="lg"
                                class="w-full"
                              >
                                <Printer class="size-4 mr-2" />
                                {printer.name || printer.type}
                              </Button>
                            )}
                          </For>
                        )}
                      </Show>
                    </Suspense>
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
