import { ConvertToSaleDialog } from "@/components/dialogs/convert-to-sale-dialog";
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
import { getDevices } from "@/lib/api/devices";
import { getDiscounts } from "@/lib/api/discounts";
import { deleteOrder, downloadOrderSheet, getOrderById } from "@/lib/api/orders";
import { A, createAsync, RouteDefinition, useAction, useNavigate, useParams, useSubmission } from "@solidjs/router";
import dayjs from "dayjs";
import ArrowLeft from "lucide-solid/icons/arrow-left";
import Edit from "lucide-solid/icons/edit";
import Loader2 from "lucide-solid/icons/loader-2";
import MoreHorizontal from "lucide-solid/icons/more-horizontal";
import Pen from "lucide-solid/icons/pen";
import Plus from "lucide-solid/icons/plus";
import Printer from "lucide-solid/icons/printer";
import Receipt from "lucide-solid/icons/receipt";
import Send from "lucide-solid/icons/send";
import ShoppingCart from "lucide-solid/icons/shopping-cart";
import Tag from "lucide-solid/icons/tag";
import X from "lucide-solid/icons/x";
import { createSignal, For, Show, Suspense } from "solid-js";
import { toast } from "solid-sonner";

export const route = {
  preload: async (props) => {
    const user = await getAuthenticatedUser();
    const sessionToken = await getSessionToken();
    const order = await getOrderById(props.params.oid);
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
  const deleteOrderAction = useAction(deleteOrder);
  const isDeletingOrder = useSubmission(deleteOrder);

  const [dialogOpen, setDialogOpen] = createSignal(false);

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
    <div class="flex flex-col md:flex-row w-full h-full gap-0 overflow-auto">
      <div class="flex flex-col gap-4 w-full p-4 border-r-0 md:border-r md:overflow-auto">
        <div class="flex flex-row items-center justify-between gap-0 w-full bg-background">
          <div class="flex flex-row items-center gap-4">
            <div class="size-8 rounded-md flex items-center justify-center bg-muted-foreground/10 dark:bg-muted/50">
              <ShoppingCart class="size-4" />
            </div>
            <div class="flex flex-row items-baseline gap-4">
              <h1 class="leading-none font-semibold">Customer Order</h1>
            </div>
          </div>
          <div class="flex flex-row items-center gap-4">
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
                        disabled={isDeletingOrder.pending}
                        onClick={() => {
                          toast.promise(deleteOrderAction(params.oid), {
                            loading: "Deleting order...",
                            success: (data) => {
                              setDeleteDialogOpen(false);
                              navigate(`/orders`);
                              return "Order deleted";
                            },
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
              <div class="flex flex-col gap-4 w-full">
                <div class="flex flex-col gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10 dark:border-primary/20 dark:bg-primary/20 dark:text-primary-foreground">
                  <div class="flex flex-row items-center gap-4 justify-between">
                    <h2 class="text-2xl font-bold tracking-wide">#{orderInfo().barcode ?? "N/A"}</h2>
                    <div class="flex flex-row items-center gap-2">
                      <Show when={orderInfo().status}>
                        {(status) => (
                          <span class="text-sm px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium uppercase">
                            {status()}
                          </span>
                        )}
                      </Show>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                      Created: {dayjs(orderInfo().createdAt).format("MMM DD, YYYY - h:mm A")}
                    </span>
                    <Show when={orderInfo().updatedAt}>
                      <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                        Updated: {dayjs(orderInfo().updatedAt).format("MMM DD, YYYY - h:mm A")}
                      </span>
                    </Show>
                    <Show when={orderInfo().deletedAt}>
                      <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                        Updated: {dayjs(orderInfo().deletedAt).format("MMM DD, YYYY - h:mm A")}
                      </span>
                    </Show>
                    <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                      Total Items:{" "}
                      {orderInfo()
                        .products.map((p) => p.quantity)
                        .reduce((a, b) => a + b, 0)}
                    </span>
                    <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                      Products: {orderInfo().products.length}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col gap-4">
                  <div class="flex flex-col gap-4">
                    <div class="flex flex-col border rounded-lg overflow-clip">
                      <div class="flex flex-row items-center justify-between w-full p-4 border-b bg-muted/30">
                        <h2 class="font-medium">Products</h2>
                        <div class="flex flex-row">
                          <Button size="sm">
                            <Pen class="size-4" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div class="flex flex-col gap-0">
                        <For
                          each={orderInfo().products}
                          fallback={
                            <div class="flex items-center justify-center py-4">
                              <span class="text-sm text-muted-foreground">No products added</span>
                            </div>
                          }
                        >
                          {(product) => (
                            <div class="flex flex-col border-b last:border-b-0 p-4 gap-4">
                              <div class="flex flex-col">
                                <div class="flex flex-row items-center justify-between">
                                  <div class="flex flex-row items-center gap-2">
                                    <div class="text-xs bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded-lg border inline-flex items-center gap-1 ">
                                      <span class="font-normal font-['Geist_Mono_Variable']">{product.quantity}</span>
                                      <span>×</span>
                                    </div>
                                    <span class="font-medium">{product.product.name}</span>
                                  </div>
                                  <div class="flex flex-row items-center gap-1">
                                    <span class="text-sm text-muted-foreground">
                                      {product.product.sellingPrice.toFixed(2)} {product.product.currency}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div class="flex flex-row items-center justify-between">
                                <div class="flex flex-col gap-0.5">
                                  <span class="text-xs text-muted-foreground">SKU: {product.product.sku}</span>
                                  <Show when={product.product.organizations[0].tg}>
                                    <span class="text-xs text-muted-foreground">
                                      {product.product.organizations[0].tg?.name} (
                                      {product.product.organizations[0].tg?.crs[0]?.tr.rate}%)
                                    </span>
                                  </Show>
                                  <Show when={product.product.weight}>
                                    {(weight) => <span class="text-xs text-muted-foreground">Weight</span>}
                                  </Show>
                                </div>
                                <div class="flex flex-col items-end font-normal font-['Geist_Mono_Variable'] gap-0.5">
                                  <span class="text-xs text-muted-foreground">
                                    {(product.product.sellingPrice * product.quantity).toFixed(2)}{" "}
                                    {product.product.currency}
                                  </span>
                                  <Show when={product.product.organizations[0].tg}>
                                    <span class="text-xs text-muted-foreground">
                                      {(
                                        (product.product.sellingPrice *
                                          product.quantity *
                                          (product.product.organizations[0].tg!.crs[0]?.tr.rate ?? 0)) /
                                        100
                                      ).toFixed(2)}{" "}
                                      {product.product.currency} Tax
                                    </span>
                                  </Show>
                                  <Show when={product.product.weight}>
                                    {(weight) => (
                                      <span class="text-xs text-muted-foreground">
                                        {weight().value} {weight().unit}
                                      </span>
                                    )}
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
                                    <div class="text-center py-4 text-sm text-muted-foreground">
                                      No discounts available
                                    </div>
                                  }
                                >
                                  {(availableDiscounts) => (
                                    <Show
                                      when={availableDiscounts().length > 0}
                                      fallback={
                                        <div class="text-center py-4 text-sm text-muted-foreground bg-muted-foreground/5 rounded-lg select-none">
                                          No discounts for this product
                                        </div>
                                      }
                                    >
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
                </div>
              </div>
            )}
          </Show>
        </Suspense>
      </div>
      <div class="flex flex-col w-full md:w-[500px] p-4 h-content">
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
              <div class="flex flex-col gap-4 w-full">
                <div class="flex flex-col gap-4 p-4 border rounded-lg">
                  <h2 class="font-medium">Summary</h2>
                  <div class="flex flex-col">
                    <For
                      each={Object.entries(
                        orderInfo()
                          .products.filter((prod) => prod.product.currency !== null)
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

                              if (prod.product.organizations[0].tg) {
                                const tgKey = prod.product.organizations[0].tg.name;
                                if (!acc[currency].taxGroups.has(tgKey)) {
                                  acc[currency].taxGroups.set(tgKey, {
                                    name: prod.product.organizations[0].tg.name,
                                    rates: new Map(),
                                    total: 0,
                                  });
                                }

                                for (const cr of prod.product.organizations[0].tg.crs) {
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
                              <span class="text-sm font-normal font-['Geist_Mono_Variable']">
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
                                      <span class="text-sm font-normal font-['Geist_Mono_Variable']">
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
                            <span class="font-normal font-['Geist_Mono_Variable']">
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
                  <div class="flex flex-row gap-2 w-full">
                    <ConvertToSaleDialog
                      orderId={orderInfo().id}
                      customerId={orderInfo().customer.id}
                      saleId={orderInfo().saleId}
                      products={orderInfo().products}
                    />
                  </div>
                  <div class="flex flex-col gap-2 w-full">
                    <Button
                      size="lg"
                      variant="outline"
                      class="bg-background w-full"
                      disabled={isDownloading()}
                      onClick={() =>
                        toast.promise(downloadInvoice(orderInfo().id), {
                          loading: "Downloading Invoice...",
                          success: "Invoice Downloaded",
                          error: "Error Downloading Invoice",
                        })
                      }
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
                  <div class="w-full flex flex-col gap-2">
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
            )}
          </Show>
        </Suspense>
      </div>
    </div>
  );
}
