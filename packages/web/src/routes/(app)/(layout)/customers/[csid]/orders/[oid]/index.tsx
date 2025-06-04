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
import { getDiscounts } from "@/lib/api/discounts";
import { convertToSale, deleteOrder, downloadOrderSheet, getOrderById } from "@/lib/api/orders";
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
import Tag from "lucide-solid/icons/tag";
import Tickets from "lucide-solid/icons/tickets";
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

export default function CustomerOrderPage() {
  const params = useParams();
  const navigate = useNavigate();
  const order = createAsync(() => getOrderById(params.oid), { deferStream: true });
  const devices = createAsync(() => getDevices(), { deferStream: true });
  const discounts = createAsync(() => getDiscounts());
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const [convertToSaleDialogOpen, setConvertToSaleDialogOpen] = createSignal(false);

  const deleteOrderAction = useAction(deleteOrder);
  const isDeletingOrder = useSubmission(deleteOrder);

  const [dialogOpen, setDialogOpen] = createSignal(false);

  const convertToSaleAction = useAction(convertToSale);
  const isConvertingToSale = useSubmission(convertToSale);

  const downloadOrderSheetAction = useAction(downloadOrderSheet);
  const isDownloadingOrderSheet = useSubmission(downloadOrderSheet);

  const [isDownloading, setIsDownloading] = createSignal(false);

  const downloadInvoice = async (orderId: string) => {
    try {
      setIsDownloading(true);
      const response = await fetch(`/api/orders/${orderId}/download`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `order-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download invoice");
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
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
      <Show when={order()}>
        {(orderInfo) => (
          <div class="container flex flex-col gap-4 py-4">
            <div class="flex flex-row items-center justify-between gap-4">
              <div class="flex flex-row items-center gap-4">
                <Button variant="outline" size="sm" as={A} href={`/customers/${params.csid}`}>
                  <ArrowLeft class="size-4" />
                  Back
                </Button>
                <div class="flex flex-row items-baseline gap-2">
                  <h1 class="text-xl font-semibold">#{orderInfo().barcode ?? "N/A"}</h1>
                  <Show when={orderInfo().status}>
                    {(status) => (
                      <span
                        class={cn("text-xs font-semibold", {
                          "text-yellow-500": status().toLowerCase() === "pending",
                          "text-green-500": status().toLowerCase() === "completed",
                          "text-red-500": status().toLowerCase() === "cancelled",
                          "text-blue-500": status().toLowerCase() === "processing",
                          "text-muted-foreground": !["pending", "completed", "cancelled", "processing"].includes(
                            status().toLowerCase(),
                          ),
                        })}
                      >
                        {status()}
                      </span>
                    )}
                  </Show>
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

                <div class="flex flex-col border rounded-lg overflow-clip">
                  <div class="w-full p-4 border-b bg-muted/30">
                    <h2 class="font-medium">Products</h2>
                  </div>
                  <div class="flex flex-col gap-0">
                    <For each={orderInfo().prods}>
                      {(product) => (
                        <div class="flex flex-col hover:bg-muted-foreground/5 border-b last:border-b-0 p-4 gap-4">
                          <div class="flex flex-row items-center justify-between">
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
                                {(product.product.sellingPrice * product.quantity).toFixed(2)}{" "}
                                {product.product.currency}
                              </span>
                              <Show when={product.product.tg}>
                                <span class="text-xs text-muted-foreground">
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
                          <Suspense
                            fallback={
                              <div class="flex items-center justify-center py-4">
                                <Loader2 class="size-4 animate-spin" />
                              </div>
                            }
                          >
                            <Show
                              when={discounts()}
                              fallback={
                                <div class="text-center py-4 text-sm text-muted-foreground">No discounts available</div>
                              }
                            >
                              {(availableDiscounts) => (
                                <Show when={availableDiscounts().length > 0}>
                                  <div class="flex flex-col gap-4 ">
                                    <div class="grid grid-cols-2 gap-2">
                                      <For
                                        each={orderInfo()
                                          .sale?.discounts.filter((d) => d.productId === product.product.id)
                                          .map((d) => d.discount)}
                                      >
                                        {(discount) => (
                                          <div class="flex flex-row items-center gap-2">
                                            <span class="text-sm text-muted-foreground">
                                              {discount.name} ({discount.code})
                                            </span>
                                            <span class="text-sm font-medium">
                                              -{(discount.value ?? 0).toFixed(2)}{" "}
                                              {discount.type === "percentage" ? "%" : ""}
                                            </span>
                                          </div>
                                        )}
                                      </For>

                                      <Dialog open={dialogOpen()} onOpenChange={setDialogOpen}>
                                        <DialogTrigger
                                          as={Button}
                                          size="lg"
                                          variant="outline"
                                          class="size-40 bg-background"
                                        >
                                          <Tag class="size-4" />
                                          Apply Coupon
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Apply Discount</DialogTitle>
                                            <DialogDescription>
                                              Select a discount to apply to this product
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div class="flex flex-col gap-2 py-4">
                                            <div class="grid grid-cols-1 gap-2">
                                              <For
                                                each={availableDiscounts()}
                                                fallback={
                                                  <div class="text-center py-4 text-sm text-muted-foreground bg-muted-foreground/5 rounded-lg">
                                                    There are no discounts available.
                                                  </div>
                                                }
                                              >
                                                {(discount) => (
                                                  <Button
                                                    variant="outline"
                                                    class="w-full justify-start"
                                                    onClick={() => {
                                                      // TODO: Implement discount application
                                                      console.log("Apply discount:", discount);
                                                    }}
                                                  >
                                                    <div class="flex flex-col items-start">
                                                      <span class="font-medium">{discount.name}</span>
                                                      <span class="text-xs text-muted-foreground">
                                                        {discount.code} - {discount.value}
                                                        {discount.type === "percentage" ? "%" : ""} off
                                                      </span>
                                                    </div>
                                                  </Button>
                                                )}
                                              </For>
                                            </div>
                                          </div>
                                          <DialogFooter>
                                            <Button
                                              variant="outline"
                                              onClick={() => {
                                                setDialogOpen(false);
                                              }}
                                            >
                                              Cancel
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </div>
                                </Show>
                              )}
                            </Show>
                          </Suspense>
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
                                  tg.rates.get(rate)!.amount += Math.abs(taxAmount);
                                  tg.total += Math.abs(taxAmount);
                                  // acc[currency].total += taxAmount; // Add tax only once to total
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
                        <div class="flex flex-col gap-4">
                          <div class="flex flex-col gap-1">
                            <div class="flex justify-between">
                              <span class="text-sm font-medium">{currency}</span>
                            </div>
                            <div class="flex justify-between">
                              <span class="text-sm text-muted-foreground">Net Total</span>
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
                          </div>
                          <div class="flex flex-row items-center w-full justify-between">
                            <For each={Array.from({ length: 30 })}>
                              {() => <div class="w-1 h-px bg-muted-foreground/50"></div>}
                            </For>
                          </div>
                          <div class="flex justify-between py-2">
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
                <div class="flex flex-col gap-4 p-4 border rounded-lg">
                  <h2 class="font-medium">Actions</h2>
                  <div class="flex flex-row gap-4 w-full">
                    <Button
                      disabled={isConvertingToSale.pending || orderInfo().saleId !== null}
                      class="w-full"
                      onClick={() => {
                        setConvertToSaleDialogOpen(false);
                        toast.promise(convertToSaleAction(orderInfo().id, params.csid), {
                          loading: "Converting order to sale...",
                          success: "Order converted to sale",
                          error: "Failed to convert order to sale",
                        });
                      }}
                    >
                      <Show when={isConvertingToSale.pending} fallback={<Tickets class="size-6" />}>
                        <Loader2 class="size-6 animate-spin" />
                      </Show>
                      Convert to Sale
                    </Button>
                  </div>
                  <div class="flex flex-col xl:flex-row gap-4 w-full">
                    <Button
                      size="lg"
                      variant="outline"
                      class="bg-background w-full"
                      disabled={isDownloading()}
                      onClick={() => downloadInvoice(orderInfo().id)}
                    >
                      <Show when={isDownloading()} fallback={<Receipt class="size-6" />}>
                        <Loader2 class="size-6 animate-spin" />
                      </Show>
                      Download Invoice
                    </Button>
                    <Button size="lg" variant="outline" class="bg-background w-full">
                      <Send class="size-6" />
                      Send Order
                    </Button>
                  </div>
                  <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <div class="w-full bg-muted-foreground/5 rounded-md p-8 gap-4 flex flex-col items-center justify-center border col-span-full">
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
                                <Printer class="size-4" />
                                {printer.name || printer.type.name}
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
