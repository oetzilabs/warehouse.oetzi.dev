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
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getDevices } from "@/lib/api/devices";
import { deleteSale, getSaleById } from "@/lib/api/sales";
import { cn } from "@/lib/utils";
import { A, createAsync, useAction, useNavigate, useParams } from "@solidjs/router";
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

export default function SalePage() {
  const params = useParams();
  const navigate = useNavigate();
  const sale = createAsync(() => getSaleById(params.salesid), { deferStream: true });
  const devices = createAsync(() => getDevices(), { deferStream: true });
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const [isDownloading, setIsDownloading] = createSignal(false);

  const deleteSaleAction = useAction(deleteSale);

  const downloadInvoice = async (saleId: string) => {
    try {
      setIsDownloading(true);
      const response = await fetch(`/api/sales/${saleId}/download`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sale-${saleId}.pdf`;
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
      <Show when={sale()}>
        {(saleInfo) => (
          <div class="container flex flex-col gap-4 py-0 relative">
            <div class="sticky top-12 z-10 flex flex-row items-center justify-between gap-0 w-full bg-background">
              <div class="flex flex-row items-center gap-4">
                <Button variant="outline" size="sm" as={A} href="/sales">
                  <ArrowLeft class="size-4" />
                  Back
                </Button>
                <div class="flex flex-row items-baseline gap-2">
                  <h1 class="text-xl font-semibold">Sale</h1>
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
                          <DialogTitle>Are you sure you want to delete this sale?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete the sale and all its data.
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
                                await deleteSaleAction(saleInfo().id).catch(reject);
                                setDeleteDialogOpen(false);
                                navigate("/sales");
                                return resolve(true);
                              });
                              toast.promise(promise, {
                                loading: "Deleting sale...",
                                success: "Sale deleted",
                                error: "Failed to delete sale",
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

            <div class="flex flex-col gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10 dark:border-primary/20 dark:bg-primary/20 dark:text-primary-foreground">
              <div class="flex flex-row items-center gap-2 justify-between">
                <h2 class="text-2xl font-bold tracking-wide">#{saleInfo().barcode.replace("sale-", "")}</h2>
                <div class="flex flex-row items-center gap-2">
                  <Show when={saleInfo().status}>
                    <span class="text-sm px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium uppercase">
                      {saleInfo().status}
                    </span>
                  </Show>
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                  Created: {dayjs(saleInfo().createdAt).format("MMM DD, YYYY - h:mm A")}
                </span>
                <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                  Updated: {dayjs(saleInfo().updatedAt).format("MMM DD, YYYY - h:mm A")}
                </span>
                <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                  Total Items: {saleInfo().items.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
                <span class="text-sm text-muted-foreground dark:text-primary-foreground">
                  Products: {saleInfo().items.length}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="col-span-full md:col-span-2 flex flex-col gap-4">
                <div class="flex flex-col border rounded-lg">
                  <div class="w-full p-4 border-b bg-muted/30">
                    <h2 class="font-medium">Products</h2>
                  </div>
                  <div class="flex flex-col gap-0">
                    <For each={saleInfo().items}>
                      {(item) => (
                        <div class="flex flex-col hover:bg-muted-foreground/5 border-b last:border-b-0 p-4 gap-4">
                          <div class="flex flex-row items-center justify-between">
                            <div class="flex flex-col gap-0.5">
                              <span class="font-medium">{item.product.name}</span>
                              <span class="text-sm text-muted-foreground">SKU: {item.product.sku}</span>
                              <Show when={item.product.organizations[0].tg}>
                                <span class="text-sm text-muted-foreground">
                                  {item.product.organizations[0].tg?.name} (
                                  {item.product.organizations[0].tg?.crs[0]?.tr.rate}%)
                                </span>
                              </Show>
                              <Show when={item.product.weight}>
                                {(weight) => (
                                  <span class="text-xs text-muted-foreground">
                                    Weight: {weight().value} {weight().unit}
                                  </span>
                                )}
                              </Show>
                            </div>
                            <div class="flex flex-col items-end">
                              <div class="flex flex-row items-baseline gap-1">
                                <span class="text-sm text-muted-foreground">
                                  {item.product.sellingPrice.toFixed(2)}
                                </span>
                                <span class="font-medium">x{item.quantity}</span>
                              </div>
                              <span class="text-sm text-muted-foreground">
                                {(item.product.sellingPrice * item.quantity).toFixed(2)} {item.product.currency}
                              </span>
                              <Show when={item.product.organizations[0].tg}>
                                <span class="text-xs text-muted-foreground">
                                  {(
                                    (item.product.sellingPrice *
                                      item.quantity *
                                      (item.product.organizations[0].tg!.crs[0]?.tr.rate ?? 0)) /
                                    100
                                  ).toFixed(2)}{" "}
                                  {item.product.currency} Tax
                                </span>
                              </Show>
                            </div>
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
                        saleInfo()
                          .items.filter((item) => item.product.currency !== null)
                          .reduce(
                            (acc, item) => {
                              const currency = item.product.currency!;
                              if (!acc[currency]) {
                                acc[currency] = {
                                  subtotal: 0,
                                  taxGroups: new Map(),
                                  total: 0,
                                };
                              }

                              const amount = item.product.sellingPrice * item.quantity;
                              acc[currency].subtotal += amount;
                              acc[currency].total += amount;

                              if (item.product.organizations[0].tg) {
                                const tgKey = item.product.organizations[0].tg.name;
                                if (!acc[currency].taxGroups.has(tgKey)) {
                                  acc[currency].taxGroups.set(tgKey, {
                                    name: item.product.organizations[0].tg.name,
                                    rates: new Map(),
                                    total: 0,
                                  });
                                }

                                for (const cr of item.product.organizations[0].tg.crs) {
                                  const rate = cr.tr.rate;
                                  const taxAmount = amount * (rate / 100);
                                  const tg = acc[currency].taxGroups.get(tgKey)!;

                                  if (!tg.rates.has(rate)) {
                                    tg.rates.set(rate, { amount: 0, rate });
                                  }
                                  tg.rates.get(rate)!.amount += Math.abs(taxAmount);
                                  tg.total += Math.abs(taxAmount);
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
                  <div class="flex flex-col xl:flex-row gap-4 w-full">
                    <Button
                      size="lg"
                      variant="outline"
                      class="bg-background w-full"
                      disabled={isDownloading()}
                      onClick={() =>
                        toast.promise(downloadInvoice(saleInfo().id), {
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
                      Send Sale
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
